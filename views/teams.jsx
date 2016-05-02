import React from 'react'
import moment from 'moment'
import config from '../lib/config'
const deDate = 'DD.MM.';
const isoDate = 'YYYY-MM-DD';

function gravatarUrlFromName(name, size) {
    return `${config.gravatarUrlFromName(name)}?s=${size}`
}

function absenceClass(absence) {
    if (absence.isHoliday()) {
        return 'public-holiday';
    }
    if (absence.isTravel()) {
        return 'away';
    }
    return 'absent';
}

function absencePercentage(team, startDate, endDate) {
    let sob = team.startOfBusiness;
    let eob = team.endOfBusiness;
    let zero = startDate.clone().startOf('day').add(sob, 'minutes');
    eob -= sob;
    let start = Math.max(0, startDate.diff(zero, 'minutes'));
    let end = Math.min(eob, endDate.diff(zero, 'minutes'));
    return {
        start: start / eob,
        end: end / eob
    };
}

function statusClasses(member, date, classes) {
    let result = Array.prototype.slice.call(arguments, 2);
    for (let absence of member.absences(date)) {
        if (absence.date.isAfter(date, 'day')) break;
        result.push(absenceClass(absence));
    }
    return result.join(' ');
}


const TeamMemberCell = React.createClass({
    render() {
        let team = this.props.team;
        let day = this.props.day;
        return (<div>
            {day.absences.map((absence) => {
                let percentage = absencePercentage(team, absence.date, absence.day.endDate());
                let top = `${percentage.start * 100}%`;
                let height = `${(percentage.end - percentage.start) * 100}%`;
                let className = [absenceClass(absence),  'status'].join(' ');
                return (<span className={className} style={{top, height}} key={absence.event.icalEvent.uid}/>)
            })}
        </div>)
    }
});

const TeamHeadline = React.createClass({
    render() {
        let team = this.props.team;

        function sprint() {
            if (team.sprint.scrum) {
                return (
                    <small>S{team.sprint.count + 1}</small>
                )
            }
        }
        
        function sprintDate() {
            if (team.sprint.scrum) {
                let start = team.sprint.start.format(deDate);
                let end = team.sprint.end.format(deDate);
                return (
                    <time>{start}–{end}</time>
                )
            }
        }
        
        return (
            <h2 className="headline">
                <name>{team.name}</name>
                {sprint()}
                {sprintDate()}
            </h2>
        );
    }    
});

const Team = React.createClass({
    _team() { return this.props.team; },
    _date() { return this.props.date; },

    _startOfCalendar() {
        let today = this._date();
        let start = today.clone().locale(today.locale());
        let team = this._team();
        if (start.weekday() !== 0) { start.weekday(-7); }
        return moment.max(start, team.sprint.start);
    },

    _endOfCalendar() {
        let today = this._date();
        let team = this._team();
        let end = today.clone().locale(today.locale()).add(1, 'weeks');
        if (end.weekday() !== 6) { end.weekday(6); }
        return moment.max(end, team.sprint.end);
    },

    _dateArray(start, end) {
        let result = [];
        let date = start.clone().startOf('day');
        while (!date.isAfter(end, 'day')) {
            if (date.day() % 6 !== 0) {
                result.push(date);
            }
            date = date.clone().add(1, 'days');
        }
        return result;
    },

    _dayClass(date) {
        let result = [];
        let team = this._team();
        let today = this._date();
        
        if (date.isSame(today, 'day')) {
            result.push('today');
        }
        if (date.day() === 5) {
            result.push('preWeekend');
        }
        if (date.day() === 1) {
            result.push('postWeekend');
        }
        result.push(date.week() % 2 ? 'weekOdd' : 'weekEven');
        if (team.sprint.scrum) {
            let offSprint = date.isBefore(team.sprint.start, 'day') || date.isAfter(team.sprint.end, 'day');
            result.push(offSprint ? 'offSprint' : 'inSprint');
        }
        return result.join(' ');
    },
    

    render() {
        let team = this._team();
        let today = this._date();
        let selectedMember = team.selectedMember(today);
        let start = this._startOfCalendar();
        let end = this._endOfCalendar();
        let dates = this._dateArray(start, end);
        
        function footer(){
            if (team.sprint.scrum) {
                let summary = team.sprintSummary();
                let width = `${summary.percentage}%`;
                return (
                    <tfoot>
                    <tr>
                        <td colSpan={dates.length + 1}><div className="percentage" style={{width}}>{summary.avail}/{summary.total}d available</div></td>
                    </tr>
                    </tfoot>
                );
            }
        }
        
        function status(){
            if (team.status) return (
                <h2 className="error">Calendar failed: {team.status}, loading data from cache ({team.cacheTimestamp.format('L LT')})</h2>
            );
        }
        
        return (
            <table>
                <caption><TeamHeadline team={team}/></caption>
                <colgroup>
                    <col className="head"/>
                    {dates.map((date) => (<col className={this._dayClass(date)} key={date.toISOString()}/>))}
                </colgroup>
                <thead>
                    <tr>
                        <th/>
                        {dates.map((date) => 
                            (<th scope="col" className={this._dayClass(date)} key={date.toISOString()}>{date.format('D')}</th>)
                        )}
                    </tr>
                </thead>
                <tbody>
                    {team.members.map((member) => {
                        let className = statusClasses(member, today, selectedMember == member ? 'selected' : null);
                        return (<tr className={className} key={member.name}>
                            <th scope="row"><img src={gravatarUrlFromName(member.name, 40)}/><span>{member.name}</span></th>
                            {member.dayArray(start, end).map((day) => {
                                if (day.isWeekend()) return;
                                return (
                                    <td className={this._dayClass(day.date)} key={day.date.toISOString()}><TeamMemberCell team={team} member={member} day={day}/></td>
                                )
                            })}
                        </tr>)
                    })}
                </tbody>
                {footer()}
                {status()}
            </table>
        );
    }
});

export default React.createClass({
    render() {
        let date = this.props.date;
        
        function createTeam(team){
            return (
                <li className="team" id={team.name} key={team.name}><Team team={team} date={date}/></li>
            );
        }
        return (
            <ul className="teams">{ this.props.teams.map(createTeam) }</ul>
        );
    }
});
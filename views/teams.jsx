import React from 'react'
import moment from 'moment'
import config from '../lib/config'
const deDate = 'DD.MM.';

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

function absencePercentage(range, startDate, endDate) {
    let sob = range.startOfBusiness;
    let eob = range.endOfBusiness;
    let zero = startDate.clone().startOf('day').add(sob, 'minutes');
    eob -= sob;
    let start = Math.max(0, startDate.diff(zero, 'minutes'));
    let end = Math.min(eob, endDate.diff(zero, 'minutes'));
    return {
        start: start / eob,
        end: end / eob
    };
}


class TeamMemberCell extends React.Component {
    render() {
        let range = this.props.dateRange;
        let day = this.props.day;
        return (
            <td className={dayClass(range, day.date)}>
                <div>
                    {day.absences.map((absence) => {
                        let percentage = absencePercentage(range, absence.date, absence.day.endDate());
                        let top = `${percentage.start * 100}%`;
                        let height = `${(percentage.end - percentage.start) * 100}%`;
                        let className = [absenceClass(absence),  'status'].join(' ');
                        return (<span className={className} style={{top, height}} key={absence.event.icalEvent.uid}/>)
                    })}
                </div>
            </td>)
    }
}

class TeamHeadline extends React.Component {
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
}

function dateRange(team, currentDate) {

    let sprint = team.sprint.scrum ? {start: team.sprint.start, end: team.sprint.end} : null;

    // start at start of current week
    let start = currentDate.clone().weekday(0);
    // end at end of next week
    let end = start.clone().add('day', 13);
    if (sprint) {
        // show at least the current sprint
        start = moment.min(start, sprint.start);
        end = moment.max(end, sprint.end);
    }
    
    return {
        currentDate,
        start,
        end,
        sprint,
        startOfBusiness: team.startOfBusiness,
        endOfBusiness: team.endOfBusiness
    };
}

function dayClass(range, date) {
    let result = [];
    if (date.isSame(range.currentDate, 'day')) {
        result.push('today');
    }
    if (date.day() === 5) {
        result.push('preWeekend');
    }
    if (date.day() === 1) {
        result.push('postWeekend');
    }
    result.push(date.week() % 2 ? 'weekOdd' : 'weekEven');
    if (range.sprint) {
        let offSprint = date.isBefore(range.sprint.start, 'day') || date.isAfter(range.sprint.end, 'day');
        result.push(offSprint ? 'offSprint' : 'inSprint');
    }
    return result.join(' ');
}

function dateArray(start, end) {
    let result = [];
    let date = start.clone().startOf('day');
    while (!date.isAfter(end, 'day')) {
        if (date.day() % 6 !== 0) {
            result.push(date);
        }
        date = date.clone().add(1, 'days');
    }
    return result;
}

class Status extends React.Component {
    render() {
        return (
            <h2 className="error">Calendar failed: {this.props.status}, loading data from cache ({this.props.lastModified.format('L LT')})</h2>
        );
    }
}

class AvailabilityFooter extends React.Component {
    render() {
        let avail = this.props.available; 
        let total = this.props.total;
        let cols = this.props.cols;
        let width = `${avail/total * 100}%`;
        return (
            <tfoot>
            <tr>
                <td colSpan={cols}><div className="percentage" style={{width}}>{avail}/{total}d available</div></td>
            </tr>
            </tfoot>
        );
    }
}

class TeamMemberRow extends React.Component {
    render() {
        let range = this.props.dateRange;
        let member = this.props.member;
        let selected = this.props.selected;

        let classNames = [];
        for (let absence of member.absences(range.currentDate)) {
            if (absence.date.isAfter(range.currentDate, 'day')) break;
            classNames.push(absenceClass(absence));
        }
        if (selected) classNames.push('selected');

        return (<tr className={classNames.join(' ')}>
            <th scope="row"><img src={gravatarUrlFromName(member.name, 40)}/><span>{member.name}</span></th>
            {member.dayArray(range.start, range.end).map((day) => {
                if (day.isWeekend()) return;
                return (
                    <TeamMemberCell dateRange={range} member={member} day={day} key={day.date.toISOString()}/>
                )
            })}
        </tr>)
    }
}

class Team extends React.Component {
    render() {
        let team = this.props.team;
        let today = this.props.date;

        let selectedMember = team.selectedMember(today);
        let summary = team.sprint.scrum ? team.sprintSummary() : null;

        let range = dateRange(team, today);
        let dates = dateArray(range.start, range.end);
        
        return (
            <table>
                <caption><TeamHeadline team={team}/></caption>
                <colgroup>
                    <col className="head"/>
                    {dates.map((date) => (<col className={dayClass(range, date)} key={date.toISOString()}/>))}
                </colgroup>
                <thead>
                    <tr>
                        <th/>
                        {dates.map((date) => 
                            (<th scope="col" className={dayClass(range, date)} key={date.toISOString()}>{date.format('D')}</th>)
                        )}
                    </tr>
                </thead>
                <tbody>
                    {team.members.map((member) => {
                        let props = {dateRange: range, member, selected: selectedMember === member};
                        return (<TeamMemberRow {...props} key={member.name}/>)
                    })}
                </tbody>
                {summary ? <AvailabilityFooter cols={dates.length + 1} available={summary.avail} total={summary.total}/> : null}
                {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp}/> : null}
            </table>
        );
    }
}

export default class Teams extends React.Component {
    render() {
        let date = this.props.date;
        let teams = this.props.teams;
        
        return (
            <ul className="teams">{
                teams.map((team) => {
                    return (<li className="team" id={team.name} key={team.name}><Team team={team} date={date}/></li>)
                })
            }</ul>
        );
    }
};
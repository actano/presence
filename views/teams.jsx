import React from 'react'
import moment from 'moment'
import config from '../lib/config'
import Status from './status'
import TeamHeadline from './team-headline'
import AvailabilityFooter from './availability-footer'
import Absences from './absences'
import absenceClass from './absence-class'

function gravatarUrlFromName(name, size) {
    return `${config.gravatarUrlFromName(name)}?s=${size}`
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

class MemberHead extends React.Component {
    render() {
        let name = this.props.member.name;
        return (
            <div><img src={gravatarUrlFromName(name, 40)}/><span>{name}</span></div>
        )
    }
}

function rowClass(member, date, selected) {
    let classNames = [];
    for (let absence of member.absences(date, date)) {
        classNames.push(absenceClass(absence));
    }
    if (selected) classNames.push('selected');
    return classNames.join(' ');
}

function isWeekend(date) {
    return date.day() === 0 || date.day() === 6;
}

class Calendar extends React.Component {
    render() {
        let range = this.props.dateRange;
        let Caption = this.props.caption;
        let Foot = this.props.foot;
        let Head = this.props.rowHead;
        let Cell = this.props.cell;
        let dates = dateArray(range.start, range.end);
        let rows = this.props.rows;
        let _rowClass = this.props.rowClass;
        let _rowKey = this.props.rowKey;

        return (
            <table>
                <caption><Caption {...this.props}/></caption>
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
                {rows.map((row) => {
                    return (<tr className={_rowClass(row)} key={_rowKey(row)}>
                        <th scope="row"><Head {...this.props} row={row}/></th>
                        {dates.map((date) => {
                            if (isWeekend(date)) return;
                            return (
                                <td className={dayClass(range, date)} key={date.toISOString()}>
                                    <Cell {...this.props} row={row} date={date}/>
                                </td>
                            )
                        })}
                    </tr>)
                })}
                </tbody>
                {Foot ? <tfoot><Foot {...this.props} cols={dates.length + 1}/></tfoot> : null}
            </table>
        )
    }
}

class Cell extends React.Component {
    render() {
        let date = this.props.date;
        let member = this.props.row;
        return (<Absences dateRange={this.props.dateRange} absences={member.absences(date, date)}/>)
    };
}

class Head extends React.Component {
    render() {
        let member = this.props.row;
        return (<MemberHead member={member}/>)
    }
}

class Foot extends React.Component {
    render() {
        let summary = this.props.team.sprintSummary();
        let cols = this.props.cols;
        return (<AvailabilityFooter cols={cols} available={summary.avail} total={summary.total}/>)
    }
}

class Team extends React.Component {
    render() {
        let team = this.props.team;
        let today = this.props.date;

        let selectedMember = team.selectedMember(today);
        let range = dateRange(team, today);
        
        let props = {
            caption: TeamHeadline,
            dateRange: range,
            rows: team.members,
            rowClass: function(member){
                return rowClass(member, range.currentDate, member === selectedMember);
            },
            rowKey: function(member){
                return member.name
            },
            rowHead: Head,
            cell: Cell,
            team
        };
        
        if (team.sprint.scrum) {
            props.foot = Foot;
        }

        return (
            <Calendar {...props}/>
        )
    }
}

export default class Teams extends React.Component {
    render() {
        let date = this.props.date;
        let teams = this.props.teams;
        
        return (
            <ul className="teams">{
                teams.map((team) => {
                    return (
                        <li className="team" id={team.name} key={team.name}>
                            <Team team={team} date={date}/>
                            {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp}/> : null}
                        </li>
                    )
                })
            }</ul>
        );
    }
};
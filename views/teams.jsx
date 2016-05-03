import React from 'react'
import moment from 'moment'
import config from '../lib/config'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import absenceClass from './absence-class'
import Calendar from './calendar'
import seedrandom from 'seedrandom'

function dateKey(date) {
    return date.format('YYYY-MM-DD');
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
        sprint
    };
}

class Head extends React.Component {
    render() {
        let name = this.props.row.name;
        return (
            <div><img src={`${config.gravatarUrlFromName(name)}?s=${40}`}/><span>{name}</span></div>
        );
    }
}

function model(absence) {
    let zero = absence.date.clone().startOf('day');
    return {
        id: absence.event.icalEvent.uid,
        className: absenceClass(absence),
        start: absence.date.diff(zero, 'minutes'),
        end: absence.day.endDate().diff(zero, 'minutes')
    }
}

function memberModel(member, start = null, end = start) {
    let result = {
        name: member.name,
        absences: {}
    };
    if (start) {
        for (let absence of member.absences(start, end)) {
            let key = dateKey(absence.date);
            let absences = result.absences[key];
            if (!absences) {
                result.absences[key] = absences = [];
            }
            absences.push(model(absence));
        }
    }
    return result;
}

class Cell extends React.Component {
    render() {
        let date = this.props.date;
        let member = this.props.row;
        let absences = member.absences[dateKey(date)];
        return (<Absences {...this.props} absences={absences || []}/>)
    };
}

class Foot extends React.Component {
    render() {
        let summary = this.props.team.sprint.summary;
        let avail = summary.avail;
        let total = summary.total;
        let width = `${avail/total * 100}%`;
        return (<div className="percentage" style={{width}}>{avail}/{total}d available</div>)
    }
}

function teamModel(team, currentDate) {
    let result = {
        name: team.name,
        startOfBusiness: team.startOfBusiness,
        endOfBusiness: team.endOfBusiness,
        range: dateRange(team, currentDate),
        members: []
    };
    for (let member of team.members) {
        result.members.push(memberModel(member, result.range.start, result.range.end));
    }
    if (team.sprint.scrum) {
        let avail = [];
        let key = dateKey(currentDate);
        for (let member of result.members) {
            let absences = member.absences[key];
            if (!absences) {
                avail.push(member);
            }
        }
        if (avail.length) {
            let rng = seedrandom(key);
            avail[Math.floor(rng() * avail.length)].selected = true;
        }

        result.sprint = {
            number: team.sprint.count + 1,
            start: team.sprint.start,
            end: team.sprint.end,
            summary: team.sprintSummary()
        }
    }
    return result;
}

class Team extends React.Component {
    render() {
        let team = teamModel(this.props.team, this.props.date);

        let props = {
            caption: TeamHeadline,
            dateRange: team.range,
            rows: team.members,
            rowClass: function(member){
                let classNames = [];
                let absences = member.absences[dateKey(team.range.currentDate)];
                if (absences) {
                    for (let absence of absences) {
                        classNames.push(absence.className);
                    }
                }
                if (member.selected) classNames.push('selected');
                return classNames.join(' ');
            },
            rowKey: function(member){
                return member.name
            },
            rowHead: Head,
            cell: Cell,
            team: team,
            startOfBusiness: team.startOfBusiness,
            endOfBusiness: team.endOfBusiness
        };
        
        if (team.sprint) {
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
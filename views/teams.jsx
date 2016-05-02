import React from 'react'
import moment from 'moment'
import config from '../lib/config'
import Status from './status'
import TeamHeadline from './team-headline'
import AvailabilityFooter from './availability-footer'
import Absences from './absences'
import absenceClass from './absence-class'
import Calendar from './calendar'

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

class Head extends React.Component {
    render() {
        let name = this.props.row.name;
        return (
            <div><img src={`${config.gravatarUrlFromName(name)}?s=${40}`}/><span>{name}</span></div>
        );
    }
}

class Cell extends React.Component {
    render() {
        let date = this.props.date;
        let member = this.props.row;
        return (<Absences {...this.props} absences={member.absences(date, date)}/>)
    };
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
                let classNames = [];
                for (let absence of member.absences(range.currentDate, range.currentDate)) {
                    classNames.push(absenceClass(absence));
                }
                if (member === selectedMember) classNames.push('selected');
                return classNames.join(' ');
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
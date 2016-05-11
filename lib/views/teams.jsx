import React from 'react'
import config from '../config'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import Calendar from './calendar'

function dateKey(date) {
    return date.format('YYYY-MM-DD');
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

class Team extends React.Component {
    render() {
        let team = this.props.team;

        let props = {
            caption: TeamHeadline,
            dateRange: team.range,
            rows: team.members,
            rowClass: function(member){
                let classNames = [];
                let absences = member.absences[team.range.currentDate];
                if (absences) {
                    for (let absence of absences) {
                        classNames.push(absence.type);
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
        let teams = this.props.teams;
        
        return (
            <ul className="teams">{
                teams.map((team) => {
                    return (
                        <li className="team" id={team.name} key={team.name}>
                            <Team team={team}/>
                            {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp}/> : null}
                        </li>
                    )
                })
            }</ul>
        );
    }
};
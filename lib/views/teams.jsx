import React from 'react'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import Calendar from './calendar'
import gravatarUrlFromName from '../gravatar'

function dateKey(date) {
    return date.format('YYYY-MM-DD');
}

function Head(props) {
    let name = props.row.name;
    let gravatarPrefix = props.gravatarPrefix;
    let emailSuffix = props.emailSuffix;
    return (
        <div><img src={`${gravatarUrlFromName(gravatarPrefix, emailSuffix, name)}?s=${40}`}/><span>{name}</span></div>
    );
}

function Cell(props) {
    let date = props.date;
    let member = props.row;
    let absences = member.absences[dateKey(date)];
    return (<Absences {...props} absences={absences || []}/>)
}

function Foot(props) {
    let summary = props.team.sprint.summary;
    let avail = summary.avail;
    let total = summary.total;
    let width = `${avail/total * 100}%`;
    return (<div className="percentage" style={{width}}>{avail}/{total}d available</div>)
}

function Team(_props) {
    let team = _props.team;

    let props = {
        gravatarPrefix: _props.gravatarPrefix,
        emailSuffix: _props.emailSuffix,
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
        <div>
            <Calendar {...props}/>
            {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp}/> : null}
        </div>
    )
}

export default function Teams(props) {
    let teams = props.teams;
    if (!teams) {
        return null;
    }

    return (
        <ul className="teams">{
            teams.map((team) => {
                return (
                    <li className="team" id={team.name} key={team.name}>
                        <Team {...props} team={team}/>
                    </li>
                )
            })
        }</ul>
    );
}

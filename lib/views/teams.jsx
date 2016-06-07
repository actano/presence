import React from 'react'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import Calendar from './calendar'
import gravatarUrlFromName from '../gravatar'
import { teams as classTeams } from './teams.styl'

function dateKey(date) {
  return date.format('YYYY-MM-DD')
}

function renderHead(props) {
  const name = props.row.name
  const gravatarPrefix = props.gravatarPrefix
  const emailSuffix = props.emailSuffix
  const src = `${gravatarUrlFromName(gravatarPrefix, emailSuffix, name)}?s=${40}`
  return (
    <div><img alt={name} src={src} /><span>{name}</span></div>
  )
}

renderHead.propTypes = {
  row: React.PropTypes.object.isRequired,
  gravatarPrefix: React.PropTypes.string.isRequired,
  emailSuffix: React.PropTypes.string.isRequired,
}

function renderCell(props) {
  const date = props.date
  const member = props.row
  const absences = member.absences[dateKey(date)]
  return (<Absences {...props} absences={absences || []} />)
}

renderCell.propTypes = {
  date: React.PropTypes.object.isRequired,
  row: React.PropTypes.object.isRequired,
}

function renderFoot(props) {
  const summary = props.team.sprint.summary
  let avail = summary.avail
  let total = summary.total
  const width = `${avail / total * 100}%`
  return (<div className="percentage" style={{ width }}>{avail}/{total}d available</div>)
}

renderFoot.propTypes = {
  team: React.PropTypes.object.isRequired,
}

function Team(props) {
  const team = props.team

  const _props = {
    gravatarPrefix: props.gravatarPrefix,
    emailSuffix: props.emailSuffix,
    caption: TeamHeadline,
    dateRange: team.range,
    rows: team.members,
    rowClass: (member) => {
      const classNames = []
      const absences = member.absences[team.range.currentDate]
      if (absences) {
        for (const absence of absences) {
          classNames.push(absence.type)
        }
      }
      if (member.selected) classNames.push('selected')
      return classNames.join(' ')
    },
    rowKey: (member) => member.name,
    rowHead: renderHead,
    cell: renderCell,
    team,
    startOfBusiness: team.startOfBusiness,
    endOfBusiness: team.endOfBusiness,
  }

  if (team.sprint) {
    _props.foot = renderFoot
  }

  return (
    <div>
      <Calendar {..._props} />
      {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp} /> : null}
    </div>
  )
}

Team.propTypes = {
  team: React.PropTypes.object.isRequired,
  gravatarPrefix: React.PropTypes.string.isRequired,
  emailSuffix: React.PropTypes.string.isRequired,

}

export default function renderTeams(props) {
  const teams = props.teams
  if (!teams) {
    return null
  }

  return (
    <ul className={classTeams}>{
      teams.map((team) =>
        <li className="team" id={team.name} key={team.name}>
          <Team {...props} team={team} />
        </li>
      )
    }</ul>
  )
}

renderTeams.propTypes = {
  teams: React.PropTypes.array.isRequired,

}

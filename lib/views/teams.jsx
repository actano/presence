import React from 'react'
import PropTypes from 'prop-types'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import Calendar from './calendar'
import gravatarUrlFromName from '../gravatar'
import { teams as classTeams } from './teams.styl'

function dateKey(date) {
  return date.format('YYYY-MM-DD')
}

function renderHead({ row, gravatarPrefix, emailSuffix }) {
  const { name } = row
  const src = `${gravatarUrlFromName(gravatarPrefix, emailSuffix, name)}?s=${40}`
  return (
    <div><img alt={name} src={src} /><span>{name}</span></div>
  )
}

renderHead.propTypes = {
  row: PropTypes.object.isRequired,
  gravatarPrefix: PropTypes.string.isRequired,
  emailSuffix: PropTypes.string.isRequired,
}

function renderCell(props) {
  const { date, row } = props
  const absences = row.absences[dateKey(date)]
  return (<Absences {...props} absences={absences || []} />)
}

renderCell.propTypes = {
  date: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
}

function renderFoot(props) {
  const { summary } = props.team.sprint
  const { avail, total } = summary
  const width = `${(100 * avail) / total}%`
  return (<div className="percentage" style={{ width }}>{avail}/{total}d available</div>)
}

renderFoot.propTypes = {
  team: PropTypes.object.isRequired,
}

function Team({ team, gravatarPrefix, emailSuffix }) {
  const _props = {
    gravatarPrefix,
    emailSuffix,
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
    rowKey: member => member.name,
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
  team: PropTypes.object.isRequired,
  gravatarPrefix: PropTypes.string.isRequired,
  emailSuffix: PropTypes.string.isRequired,

}

export default function renderTeams(props) {
  const { teams } = props
  if (!teams) {
    return null
  }

  return (
    <ul className={classTeams}>{
      teams.map(team =>
        (<li className="team" id={team.name} key={team.name}>
          <Team {...props} team={team} />
         </li>))
    }
    </ul>
  )
}

renderTeams.propTypes = {
  teams: PropTypes.array.isRequired,
}

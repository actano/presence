import React from 'react'
import PropTypes from 'prop-types'
import Status from './status'
import TeamHeadline from './team-headline'
import Absences from './absences'
import Calendar, { Caption, Footer, Row, RowHead } from './calendar'
import gravatarUrlFromName from '../gravatar'
import { teams as classTeams } from './teams.styl'

function Team({ team, gravatarPrefix, emailSuffix }) {
  const rowClass = (member) => {
    const classNames = []
    const absences = member.absences[team.range.currentDate]
    if (absences) {
      for (const absence of absences) {
        classNames.push(absence.type)
      }
    }
    if (member.selected) classNames.push('selected')
    return classNames.join(' ')
  }

  let footer = null
  if (team.sprint) {
    const { summary } = team.sprint
    const { avail, total } = summary
    const width = `${(100 * avail) / total}%`
    footer = (
      <Footer>
        <div className="percentage" style={{ width }}>{avail}/{total}d available</div>
      </Footer>
    )
  }

  const gravatarSrc = name => `${gravatarUrlFromName(gravatarPrefix, emailSuffix, name)}?s=${40}`

  const MemberRow = (member) => {
    const MemberCell = ({ date }) => {
      const absences = member.absences[date] || []
      return (
        <Absences
          startOfBusiness={team.startOfBusiness}
          endOfBusiness={team.endOfBusiness}
          absences={absences}
        />
      )
    }
    MemberCell.propTypes = {
      date: PropTypes.string,
    }
    MemberCell.defaultProps = {
      date: '0000-00-00',
    }

    return (
      <Row className={rowClass(member)} key={member.name} dateRange={team.range} >
        <RowHead>
          <div>
            <img alt={member.name} src={gravatarSrc(member.name)} /><span>{member.name}</span>
          </div>
        </RowHead>
        <MemberCell />
      </Row>
    )
  }

  return (
    <div>
      <Calendar dateRange={team.range}>
        <Caption><TeamHeadline team={team} /></Caption>
        {team.members.map(MemberRow)}
        {footer}
      </Calendar>
      {team.status ? <Status status={team.status} lastModified={team.cacheTimestamp} /> : null}
    </div>
  )
}

const teamType = PropTypes.object

Team.propTypes = {
  team: teamType.isRequired,
  gravatarPrefix: PropTypes.string.isRequired,
  emailSuffix: PropTypes.string.isRequired,
}

export default function renderTeams(props) {
  const { teams } = props

  const renderTeam = team => (
    <li className="team" id={team.name} key={team.name}>
      <Team {...props} team={team} />
    </li>
  )

  return (
    <ul className={classTeams}>{teams.map(renderTeam)}</ul>
  )
}

renderTeams.propTypes = {
  teams: PropTypes.arrayOf(teamType),
}

renderTeams.defaultProps = {
  teams: [],
}

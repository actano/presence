import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

function format(date) {
  return moment(date).format('DD.MM.')
}

export default function renderTeamHeadline(props) {
  const team = props.team
  const sprint = team.sprint

  return (
    <h2 className="headline">
      <name>{team.name}</name>
      {sprint ? <small>S{sprint.number}</small> : null}
      {sprint ? <time>{format(sprint.start)}–{format(sprint.end)}</time> : null}
    </h2>
  )
}

renderTeamHeadline.propTypes = {
  team: PropTypes.object.isRequired,
}

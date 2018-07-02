import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

function format(date) {
  return moment(date).format('DD.MM.')
}

export default function renderTeamHeadline({ team }) {
  const { sprint } = team

  return (
    <h2 className="headline">
      <span className="name">{team.name}</span>
      {sprint ? <small>S{sprint.number}</small> : null}
      {sprint ? <time>{format(sprint.start)}–{format(sprint.end)}</time> : null}
    </h2>
  )
}

renderTeamHeadline.propTypes = {
  team: PropTypes.shape({
    sprint: PropTypes.shape({
      number: PropTypes.number.isRequired,
      start: PropTypes.string.isRequired,
      end: PropTypes.string.isRequired,
    }),
  }).isRequired,
}

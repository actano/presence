import React from 'react'
import PropTypes from 'prop-types'

export default function renderAbsences(props) {
  const absences = props.absences
  const sob = props.startOfBusiness
  const eob = props.endOfBusiness - sob

  return (
    <div>
      {absences.map((absence) => {
        const start = Math.max(0, absence.start - sob) / eob
        const end = Math.min(eob, absence.end - sob) / eob

        const top = `${start * 100}%`
        const height = `${(end - start) * 100}%`
        const className = `${absence.type} status`
        return (<span className={className} style={{ top, height }} key={absence.id} />)
      })}
    </div>
  )
}

renderAbsences.propTypes = {
  absences: PropTypes.arrayOf(PropTypes.object).isRequired,
  startOfBusiness: PropTypes.number.isRequired,
  endOfBusiness: PropTypes.number.isRequired,
}

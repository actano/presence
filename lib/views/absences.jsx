import React from 'react'

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
  absences: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  startOfBusiness: React.PropTypes.number.isRequired,
  endOfBusiness: React.PropTypes.number.isRequired,
}

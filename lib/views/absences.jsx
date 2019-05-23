import React from 'react'
import PropTypes from 'prop-types'


export default function renderAbsences({ absences, startOfBusiness, endOfBusiness }) {
  const dayLength = endOfBusiness - startOfBusiness

  // eslint-disable-next-line object-curly-newline, react/prop-types
  const renderAbsence = ({ id, start, end, type }) => {
    const relStart = Math.max(0, start - startOfBusiness) / dayLength
    const relEnd = Math.min(dayLength, end - startOfBusiness) / dayLength

    const top = `${relStart * 100}%`
    const height = `${(relEnd - relStart) * 100}%`
    const className = `${type} status`
    return (<span className={className} style={{ top, height }} key={id} />)
  }

  const orderAbsencesByType = () => {
    var orderedAbsences = [...absences.slice(0)]
    orderedAbsences.sort((a,b) => {
      // prefer type = 'travel' over 'leaves'
      const a_travel = a.type === 'travel'
      const b_travel = b.type === 'travel'
      if (a_travel && ! b_travel)
        return -1
      if (! a_travel && b_travel)
        return 1
      return 0
    })
    return orderedAbsences
  }

  return <div>
    {orderAbsencesByType().map(renderAbsence)}
  </div>
}

renderAbsences.propTypes = {
  absences: PropTypes.arrayOf(PropTypes.object).isRequired,
  startOfBusiness: PropTypes.number.isRequired,
  endOfBusiness: PropTypes.number.isRequired,
}

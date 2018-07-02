import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

function isWeekend(date) {
  return date.day() === 0 || date.day() === 6
}

function dateArray(start, end) {
  const result = []
  const _end = moment(end).startOf('day')
  let date = moment(start).startOf('day')
  while (!date.isAfter(_end, 'day')) {
    if (date.day() % 6 !== 0) {
      result.push(date)
    }
    date = date.clone().add(1, 'days')
  }
  return result
}

function dayClass(range, date) {
  const result = []
  if (date.isSame(range.currentDate, 'day')) {
    result.push('today')
  }
  if (date.day() === 5) {
    result.push('preWeekend')
  }
  if (date.day() === 1) {
    result.push('postWeekend')
  }
  result.push(date.week() % 2 ? 'weekOdd' : 'weekEven')
  if (range.sprint) {
    const beforeSprint = date.isBefore(range.sprint.start, 'day')
    const afterSprint = date.isAfter(range.sprint.end, 'day')
    const offSprint = beforeSprint || afterSprint
    result.push(offSprint ? 'offSprint' : 'inSprint')
  }
  return result.join(' ')
}

export default function renderCalendar(props) {
  const {
    Caption, Cell, Foot, RowHead, dateRange, rows, rowClass, rowKey,
  } = props
  const dates = dateArray(dateRange.start, dateRange.end)

  const renderRow = (row) => {
    const rowDates = (date) => {
      if (isWeekend(date)) return null
      return (
        <td className={dayClass(dateRange, date)} key={date.toISOString()}>
          <Cell {...props} row={row} date={date} />
        </td>
      )
    }

    return (
      <tr className={rowClass(row)} key={rowKey(row)}>
        <th scope="row"><RowHead {...props} row={row} /></th>
        {dates.map(rowDates)}
      </tr>
    )
  }

  const renderFoot = () => (
    <tfoot>
      <tr>
        <td colSpan={dates.length + 1}><Foot {...props} cols={dates.length + 1} /></td>
      </tr>
    </tfoot>
  )

  return (
    <table>
      <caption><Caption {...props} /></caption>
      <colgroup>
        <col className="head" />
        {dates.map(date => (
          <col className={dayClass(dateRange, date)} key={date.toISOString()} />))}
      </colgroup>
      <thead>
        <tr>
          <th />
          {dates.map(date => (<th scope="col" className={dayClass(dateRange, date)} key={date.toISOString()}>{date.format('D')}</th>))}
        </tr>
      </thead>
      <tbody>
        {rows.map(renderRow)}
      </tbody>
      {Foot ? renderFoot() : null}
    </table>
  )
}

renderCalendar.propTypes = {
  dateRange: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }).isRequired,
  Caption: PropTypes.func.isRequired,
  Foot: PropTypes.func,
  RowHead: PropTypes.func.isRequired,
  Cell: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowClass: PropTypes.func.isRequired,
  rowKey: PropTypes.func.isRequired,
}

renderCalendar.defaultProps = {
  Foot: null,
}

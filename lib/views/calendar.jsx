import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

function isWeekend(sdate) {
  const date = moment(sdate)
  return date.day() === 0 || date.day() === 6
}

function dateArray(start, end) {
  const result = []
  const _end = moment(end).startOf('day')
  let date = moment(start).startOf('day')
  while (!date.isAfter(_end, 'day')) {
    if (date.day() % 6 !== 0) {
      result.push(date.format('YYYY-MM-DD'))
    }
    date = date.clone().add(1, 'days')
  }
  return result
}

function dayClass(range, sdate) {
  const date = moment(sdate)
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

const parseChildren = (children, map) => {
  const result = {
    other: [],
  }
  const keys = Object.keys(map)
  React.Children.forEach(children, (child) => {
    if (!child || !child.type) return
    const { type } = child
    for (const key of keys) {
      if (type !== map[key]) {
        result.other.push(child)
      } else if (Array.isArray(result[key])) {
        result[key].push(child)
      } else if (result[key]) {
        result[key] = [result[key], child]
      } else {
        result[key] = child
      }
    }
  })
  return result
}

export const Caption = ({ children }) => <caption>{children}</caption>
Caption.propTypes = {
  children: PropTypes.node.isRequired,
}

export const RowHead = ({ children }) => <th scope="row">{children}</th>
RowHead.propTypes = {
  children: PropTypes.node.isRequired,
}


export const Row = ({ className, dateRange, children }) => {
  const dates = dateArray(dateRange.start, dateRange.end)
  const Children = parseChildren(children, { RowHead })

  const rowDates = (date) => {
    if (isWeekend(date)) return null
    return (
      <td className={dayClass(dateRange, date)} key={date}>
        {React.cloneElement(Children.other[0], { date })}
      </td>
    )
  }
  return (
    <tr className={className}>
      {Children.RowHead}
      {dates.map(rowDates)}
    </tr>
  )
}

Row.propTypes = {
  className: PropTypes.string,
  dateRange: PropTypes.shape({}).isRequired,
  children: PropTypes.node.isRequired,
}

Row.defaultProps = {
  className: '',
}

export const Footer = ({ children }) => children

export default function renderCalendar({ dateRange, children }) {
  const Children = parseChildren(children, { Caption, Footer, Row })

  const dates = dateArray(dateRange.start, dateRange.end)

  const renderFoot = () => (
    <tfoot>
      <tr>
        <td colSpan={dates.length + 1}>
          {React.cloneElement(Children.Footer, { cols: dates.length + 1 })}
        </td>
      </tr>
    </tfoot>
  )

  return (
    <table>
      {Children.Caption}
      <colgroup>
        <col className="head" />
        {dates.map(date => (
          <col className={dayClass(dateRange, date)} key={date} />))}
      </colgroup>
      <thead>
        <tr>
          <th />
          {dates.map(date => (
            <th scope="col" className={dayClass(dateRange, date)} key={date}>
              {moment(date).format('D')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Children.Row}
      </tbody>
      {Children.Footer ? renderFoot() : null}
    </table>
  )
}

renderCalendar.propTypes = {
  dateRange: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
}

renderCalendar.defaultProps = {
  Foot: null,
}

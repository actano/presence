import React from 'react'
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
  const range = props.dateRange
  let Caption = props.caption
  let Foot = props.foot
  let Head = props.rowHead
  let Cell = props.cell
  const dates = dateArray(range.start, range.end)
  const rows = props.rows
  const _rowClass = props.rowClass
  const _rowKey = props.rowKey

  return (
    <table>
      <caption><Caption {...props} /></caption>
      <colgroup>
        <col className="head" />
        {dates.map((date) => (
          <col className={dayClass(range, date)} key={date.toISOString()} />))}
      </colgroup>
      <thead>
        <tr>
          <th />
          {dates.map((date) =>
            (<th
              scope="col"
              className={dayClass(range, date)}
              key={date.toISOString()}
            >{date.format('D')}</th>)
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) =>
          <tr className={_rowClass(row)} key={_rowKey(row)}>
            <th scope="row"><Head {...props} row={row} /></th>
            {dates.map((date) => {
              if (isWeekend(date)) return null
              return (
                <td className={dayClass(range, date)} key={date.toISOString()}>
                  <Cell {...props} row={row} date={date} />
                </td>
              )
            })}
          </tr>
        )}
      </tbody>
      {Foot ? <tfoot>
        <tr>
          <td colSpan={dates.length + 1}><Foot {...props} cols={dates.length + 1} /></td>
        </tr>
      </tfoot> : null}
    </table>
  )
}

renderCalendar.propTypes = {
  dateRange: React.PropTypes.object.isRequired,
  caption: React.PropTypes.element.isRequired,
  foot: React.PropTypes.element.isRequired,
  rowHead: React.PropTypes.element.isRequired,
  cell: React.PropTypes.element.isRequired,
  rows: React.PropTypes.array.isRequired,
  rowClass: React.PropTypes.func.isRequired,
  rowKey: React.PropTypes.func.isRequired,
}

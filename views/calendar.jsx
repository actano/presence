import React from 'react'

function isWeekend(date) {
    return date.day() === 0 || date.day() === 6;
}

function dateArray(start, end) {
    let result = [];
    let date = start.clone().startOf('day');
    while (!date.isAfter(end, 'day')) {
        if (date.day() % 6 !== 0) {
            result.push(date);
        }
        date = date.clone().add(1, 'days');
    }
    return result;
}

function dayClass(range, date) {
    let result = [];
    if (date.isSame(range.currentDate, 'day')) {
        result.push('today');
    }
    if (date.day() === 5) {
        result.push('preWeekend');
    }
    if (date.day() === 1) {
        result.push('postWeekend');
    }
    result.push(date.week() % 2 ? 'weekOdd' : 'weekEven');
    if (range.sprint) {
        let offSprint = date.isBefore(range.sprint.start, 'day') || date.isAfter(range.sprint.end, 'day');
        result.push(offSprint ? 'offSprint' : 'inSprint');
    }
    return result.join(' ');
}

export default class Calendar extends React.Component {
    render() {
        let range = this.props.dateRange;
        let Caption = this.props.caption;
        let Foot = this.props.foot;
        let Head = this.props.rowHead;
        let Cell = this.props.cell;
        let dates = dateArray(range.start, range.end);
        let rows = this.props.rows;
        let _rowClass = this.props.rowClass;
        let _rowKey = this.props.rowKey;

        return (
            <table>
                <caption><Caption {...this.props}/></caption>
                <colgroup>
                    <col className="head"/>
                    {dates.map((date) => (<col className={dayClass(range, date)} key={date.toISOString()}/>))}
                </colgroup>
                <thead>
                <tr>
                    <th/>
                    {dates.map((date) =>
                        (<th scope="col" className={dayClass(range, date)} key={date.toISOString()}>{date.format('D')}</th>)
                    )}
                </tr>
                </thead>
                <tbody>
                {rows.map((row) => {
                    return (<tr className={_rowClass(row)} key={_rowKey(row)}>
                        <th scope="row"><Head {...this.props} row={row}/></th>
                        {dates.map((date) => {
                            if (isWeekend(date)) return;
                            return (
                                <td className={dayClass(range, date)} key={date.toISOString()}>
                                    <Cell {...this.props} row={row} date={date}/>
                                </td>
                            )
                        })}
                    </tr>)
                })}
                </tbody>
                {Foot ? <tfoot><Foot {...this.props} cols={dates.length + 1}/></tfoot> : null}
            </table>
        )
    }
}

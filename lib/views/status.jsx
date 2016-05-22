import React from 'react'
import moment from 'moment'

export default class Status extends React.Component {
    render() {
        return (
            <h2 className="error">Calendar failed: {this.props.status}, loading data from cache ({moment(this.props.lastModified).format('L LT')})</h2>
        );
    }
}


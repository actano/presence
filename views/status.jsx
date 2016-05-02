import React from 'react'

export default class Status extends React.Component {
    render() {
        return (
            <h2 className="error">Calendar failed: {this.props.status}, loading data from cache ({this.props.lastModified.format('L LT')})</h2>
        );
    }
}


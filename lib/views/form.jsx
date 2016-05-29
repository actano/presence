import React from 'react'

export default class Form extends React.Component {
    render() {
        return (
            <h1>
                Presence for <input id="dateinput" type="date" name="date" value={this.props.date}/>
            </h1>
        );
    }
}
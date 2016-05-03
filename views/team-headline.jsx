import React from 'react'

function format(date) {
    return date.format('DD.MM.');
}

export default class TeamHeadline extends React.Component {
    render() {
        let team = this.props.team;
        
        let sprint = team.sprint;
        
        return (
            <h2 className="headline">
                <name>{team.name}</name>
                {sprint ? <small>S{sprint.number}</small> : null}
                {sprint ? <time>{format(sprint.start)}–{format(sprint.end)}</time> : null}
            </h2>
        );
    }
}

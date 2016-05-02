import React from 'react'

const deDate = 'DD.MM.';

export default class TeamHeadline extends React.Component {
    render() {
        let team = this.props.team;

        function sprint() {
            if (team.sprint.scrum) {
                return (
                    <small>S{team.sprint.count + 1}</small>
                )
            }
        }

        function sprintDate() {
            if (team.sprint.scrum) {
                let start = team.sprint.start.format(deDate);
                let end = team.sprint.end.format(deDate);
                return (
                    <time>{start}–{end}</time>
                )
            }
        }

        return (
            <h2 className="headline">
                <name>{team.name}</name>
                {sprint()}
                {sprintDate()}
            </h2>
        );
    }
}

import React from 'react'
import Teams from './teams.jsx'
const isoDate = 'YYYY-MM-DD';

export default React.createClass({
    render() {
        return (
            <html>
            <head>
                <title>Actano - Presence</title>
                <link rel="stylesheet" href="/styles.css"/>
                <meta name="viewport" content="width=device-width"/>
            </head>
            <body>
                <form action="/">
                    <h1>
                        Presence for <input id="dateinput" type="date" name="date" value={this.props.date.format(isoDate)}/><input type="submit" style={{visibility: 'hidden'}}/>
                    </h1>
                </form>
                <Teams teams={this.props.teams} date={this.props.date}/>
                <script type="text/javascript" src="/client.js"></script>
            </body>
            </html>
        );
    }
});
import React from 'react'
import Teams from './teams.jsx'

export default class Page extends React.Component {
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
                        Presence for <input id="dateinput" type="date" name="date" value={this.props.date}/><input type="submit" style={{visibility: 'hidden'}}/>
                    </h1>
                </form>
                <Teams teams={this.props.teams}/>
                <script type="text/javascript" src="/client.js"></script>
            </body>
            </html>
        );
    }
}
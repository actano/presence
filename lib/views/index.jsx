import React from 'react'
import Teams from './teams.jsx'

export default class Page extends React.Component {
    render() {
        let form = () => {
            return (
                <form action="/">
                    <h1>
                        Presence for <input id="dateinput" type="date" name="date" value={this.props.date}/><input type="submit" style={{visibility: 'hidden'}}/>
                    </h1>
                </form>
            );
        };
        return (
            <html>
            <head>
                <title>Actano - Presence</title>
                <meta name="viewport" content="width=device-width"/>
            </head>
            <body>
                {this.props.framed ? null : form()}
                <div>
                    <script type="text/javascript" src="/client.js"></script>
                </div>
            </body>
            </html>
        );
    }
}
import React from 'react'

export default class Page extends React.Component {
    render() {
        let form = () => {
            return (
                <h1>
                    Presence for <input id="dateinput" type="date" name="date" value={this.props.date}/>
                </h1>
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
                    <script type="text/javascript" src="client.js"></script>
                </div>
            </body>
            </html>
        );
    }
}
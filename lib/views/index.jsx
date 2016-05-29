import React from 'react'

export default class Page extends React.Component {
    render() {
        return (
            <html>
            <head>
                <title>Actano - Presence</title>
                <meta name="viewport" content="width=device-width"/>
            </head>
            <body>
                <div>
                    <script type="text/javascript" src={this.props.framed ? 'auto.js' : 'edit.js'}></script>
                </div>
            </body>
            </html>
        );
    }
}
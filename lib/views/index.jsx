import React from 'react'
import Form from './form'

export default class Page extends React.Component {
    render() {
        return (
            <html>
            <head>
                <title>Actano - Presence</title>
                <meta name="viewport" content="width=device-width"/>
            </head>
            <body>
                {this.props.framed ? null : <Form date={this.props.date}/>}
                <div>
                    <script type="text/javascript" src={this.props.framed ? 'auto.js' : 'edit.js'}></script>
                </div>
            </body>
            </html>
        );
    }
}
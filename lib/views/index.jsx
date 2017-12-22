import React from 'react'
import PropTypes from 'prop-types'

export default function renderPage(props) {
  return (
    <html>
      <head>
        <title>Actano - Presence</title>
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <div>
          <script type="text/javascript" src={props.framed ? 'auto.js' : 'edit.js'} />
        </div>
      </body>
    </html>
  )
}

renderPage.propTypes = {
  framed: PropTypes.bool,
}

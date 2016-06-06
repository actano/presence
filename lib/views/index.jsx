import React from 'react'

export default function renderPage(props) {
  return (
    <html>
      <head>
        <title>Actano - Presence</title>
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <div>
          <script type="text/javascript" src={props.framed ? 'auto.js' : 'edit.js'}></script>
        </div>
      </body>
    </html>
  )
}

renderPage.propTypes = {
  framed: React.PropTypes.bool,
}

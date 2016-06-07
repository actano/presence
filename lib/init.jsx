import React from 'react'
import { render } from 'react-dom'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import store from './redux'
import { actionCreator as changeServer, select as selectServer } from './redux/server'
import { actionCreator as changeDate, select as selectDate } from './redux/date'
import Teams from './views/teams.jsx'

export default function init(uri) {
  store.subscribe(() => {
    const state = store.getState()
    const _server = selectServer(state)
    const serverDate = _server && _server.date
    if (serverDate) {
      const date = selectDate(state)
      if (!date) {
        store.dispatch(changeDate(serverDate))
      } else if (serverDate !== date) {
        store.dispatch(changeServer())
        queryServerUpdate()
      }
    }
  })

  const server = io(uri, { path: '/rt' });
  ['connect', 'reconnect'].forEach((event) => {
    server.on(event, queryServerUpdate)
  })

  server.on('update', queryServerUpdate)

  server.on('teams', (data) => {
    store.dispatch(changeServer(data))
  })

  function queryServerUpdate() {
    const state = store.getState()
    const date = selectDate(state)
    if (date) {
      server.emit('date', date)
    }
  }

  function mapStateToProps(state) {
    return selectServer(state) || {}
  }

  let App = connect(mapStateToProps)(Teams)

  return function actanoPresence(element, Header) {
    if (Header) {
      render(<Provider store={store}>
        <div>
          <Header />
          <App />
        </div>
      </Provider>, element)
    } else {
      render(<Provider store={store}>
        <App />
      </Provider>, element)
    }
  }
}

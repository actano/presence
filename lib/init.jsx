import React from 'react'
import { render } from 'react-dom'
import { connect, Provider } from 'react-redux'
import io from 'socket.io-client'
import store from './redux'
import { actionCreator as changeDate, select as selectDate } from './redux/date'
import { actionCreator as changeServer, select as selectServer } from './redux/server'
import Teams from './views/teams'

export default function init(uri) {
  const server = io(uri, { path: '/rt' })

  function queryServerUpdate() {
    const state = store.getState()
    const date = selectDate(state)
    if (date) {
      server.emit('date', date)
    }
  }

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

  server.on('connect', queryServerUpdate)
  server.on('reconnect', queryServerUpdate)
  server.on('update', queryServerUpdate)

  server.on('teams', (data) => {
    store.dispatch(changeServer(data))
  })

  function mapStateToProps(state) {
    return selectServer(state) || {}
  }

  const App = connect(mapStateToProps)(Teams)

  return (element, Header) => {
    if (Header) {
      const v = (
        <Provider store={store}>
          <div>
            <Header />
            <App />
          </div>
        </Provider>
      )
      render(v, element)
    } else {
      const v = (
        <Provider store={store}>
          <App />
        </Provider>
      )
      render(v, element)
    }
  }
}

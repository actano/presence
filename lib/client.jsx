// eslint-disable-next-line no-unused-vars
import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import { render } from 'react-dom'
import React from 'react'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import { actionCreator as changeServer, select as selectServer } from './redux/server'
import { actionCreator as changeDate, select as selectDate } from './redux/date'
import store from './redux'

export default function init(Header) {
  const server = io({ path: '/rt' })
  let container = document.querySelector('.actano-presence')
  if (!container) {
    container = document.all[document.all.length - 1].parentElement
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

  function mapStateToProps(state) {
    return selectServer(state) || {}
  }

  function queryServerUpdate() {
    const state = store.getState()
    const date = selectDate(state)
    if (date) {
      server.emit('date', date)
    }
  }

  let App = connect(mapStateToProps)(Teams);

  ['connect', 'reconnect'].forEach((event) => {
    server.on(event, queryServerUpdate)
  })

  server.on('update', queryServerUpdate)

  server.on('teams', (data) => {
    store.dispatch(changeServer(data))
  })

  render(<Provider store={store}>
    <div>
      {Header ? <Header /> : null}
      <App />
    </div>
  </Provider>, container)
}

import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import { render } from 'react-dom'
import React from 'react'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import {actionCreator as changeServer, select as selectServer} from './redux/server'
import {actionCreator as changeDate, select as selectDate} from './redux/date'
import store from './redux'

export default function init(Header) {
    let server = io({path: "/rt"});
    let container = document.all[document.all.length-1].parentElement;

    store.subscribe(() => {
        let state = store.getState();
        let server = selectServer(state);
        let serverDate = server && server.date;
        if (serverDate) {
            let date = selectDate(state);
            if (!date) {
                store.dispatch(changeDate(serverDate));
            } else if (serverDate !== date) {
                store.dispatch(changeServer());
                queryServerUpdate();
            }
        }
    });

    function mapStateToProps(state) {
        return selectServer(state) || {};
    }
    
    function queryServerUpdate() {
        let state = store.getState();
        let date = selectDate(state);
        if (date) {
            server.emit('date', date);
        }
    }

    let App = connect(mapStateToProps)(Teams);

    ['connect', 'reconnect'].forEach((event) => {
        server.on(event, queryServerUpdate);
    });
    
    server.on('update', queryServerUpdate);

    server.on('teams', (data) => {
        store.dispatch(changeServer(data));
    });

    render(<Provider store={store}>
        <div>
        {Header ? <Header/> : null}
        <App/>
        </div>
    </Provider>, container)
}

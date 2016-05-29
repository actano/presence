import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import { render } from 'react-dom'
import React from 'react'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import {actionCreator as changeTeams} from './redux/teams'
import {actionCreator as changeDate} from './redux/date'
import store from './store'

export default function init() {
    let server = io({path: "/rt"});
    let container = document.all[document.all.length-1].parentElement;

    let selectDate = (state) => state && state.date;
    let selectServerDate = (state) => state && state.server && state.server.date;
    
    store.subscribe(() => {
        let state = store.getState();
        let serverDate = selectServerDate(state);
        if (serverDate) {
            let date = selectDate(state);
            if (!date) {
                store.dispatch(changeDate(serverDate));
            } else if (serverDate !== date) {
                store.dispatch(changeTeams());
                queryServerUpdate();
            }
        }
    });

    function mapStateToProps(state) {
        return state && state.server || {};
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
        store.dispatch(changeTeams(data));
    });

    render(<Provider store={store}>
        <App/>
    </Provider>, container)
}

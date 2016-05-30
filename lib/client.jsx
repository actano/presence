import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import { render } from 'react-dom'
import React from 'react'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import {actionCreator as changeTeams, select as selectTeams} from './redux/teams'
import {actionCreator as changeDate, select as selectDate} from './redux/date'
import store from './redux'

export default function init(Header) {
    let server = io({path: "/rt"});
    let container = document.all[document.all.length-1].parentElement;

    store.subscribe(() => {
        let state = store.getState();
        let server = selectTeams(state);
        let serverDate = server && server.date;
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
        <div>
        {Header ? <Header/> : null}
        <App/>
        </div>
    </Provider>, container)
}

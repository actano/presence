import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import { render } from 'react-dom'
import React from 'react'
import moment from 'moment'
import io from 'socket.io-client'
import { Provider, connect } from 'react-redux'
import { createStore } from 'redux'
import presence from './redux'
import {actionCreator as changeTeams} from './redux/teams'
import {actionCreator as changeDate} from './redux/date'

function init() {
    let server = io({path: "/rt"});
    let container = document.all[document.all.length-1].parentElement;
    let store = createStore(presence);

    store.subscribe(() => {
        let state = store.getState();
        let serverDate = state.server ? state.server.date : null;
        if (serverDate) {
            let date = state.date;
            if (!date) {
                store.dispatch(changeDate(serverDate));
            } else if (serverDate !== date) {
                console.log(`${serverDate} !== ${date}`);
                store.dispatch(changeTeams());
                server.emit('date', date);
            }
        }
    });

    function mapStateToProps(state) {
        return state && state.server || {};
    }

    let App = connect(mapStateToProps)(Teams);

    let dateVal = moment().format('YYYY-MM-DD');

    let dateInput = document.getElementById('dateinput');
    if (dateInput) {
        dateVal = moment(dateInput.value).format('YYYY-MM-DD');

        dateInput.onblur = function(){
            dateVal = moment(dateInput.value).format('YYYY-MM-DD');
            store.dispatch(changeDate(dateVal));
        };
    } else {
        // follow the sun
        setInterval(() => {
            dateVal = moment().format('YYYY-MM-DD');
            store.dispatch(changeDate(dateVal));
        }, 10000);
    }

    ['connect', 'reconnect'].forEach((event) => {
        server.on(event, () => server.emit('date', dateVal));
    });
    
    server.on('update', () => server.emit('date', dateVal));

    server.on('teams', (data) => {
        store.dispatch(changeTeams(data));
    });

    render(<Provider store={store}>
        <App/>
    </Provider>, container)
}
init();

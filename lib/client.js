import css from './views/styles.styl'
import Teams from './views/teams.jsx'
import ReactDOM from 'react-dom'
import React from 'react'
import moment from 'moment'
import io from 'socket.io-client'

function init() {
    let server = io({path: "/rt"});
    let container = document.all[document.all.length-1].parentElement;
    let dateVal = moment().format('YYYY-MM-DD');

    let dateInput = document.getElementById('dateinput');
    if (dateInput) {
        dateVal = moment(dateInput.value).format('YYYY-MM-DD');
        let newVal = dateVal;

        server.on('teams', (data) => {
            // ignore result if not for wanted date
            if (newVal !== data.date) {
                return false;
            }
            dateVal = data.date;
            dateInput.disabled = false;
        });

        dateInput.onblur = function(){
            newVal = moment(dateInput.value).format('YYYY-MM-DD');
            if (newVal != dateVal) {
                dateInput.disabled = true;
                server.emit('date', newVal);
            }
        };
    } else {
        // follow the sun
        setInterval(() => {
            let now = moment().format('YYYY-MM-DD');
            if (now != dateVal) {
                dateVal = now;
                server.emit('date', dateVal);
            }
        }, 10000);
    }

    ['connect', 'reconnect'].forEach((event) => {
        server.on(event, () => server.emit('date', dateVal));
    });

    server.on('teams', (data) => {
        ReactDOM.render(
            React.createElement(Teams, data),
            container
        );
    });
}

init();
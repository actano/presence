import css from './views/styles.styl'
import agent from 'superagent'
import Teams from './views/teams.jsx'
import ReactDOM from 'react-dom'
import React from 'react'

function init() {
    let dateInput = document.getElementById('dateinput');
    dateInput.onchange = function(){
        document.forms[0].submit();
    };

    let container = document.all[document.all.length-1].parentElement;
    agent.get('/').accept('application/json').end((err, resp) => {
        if (err) {
            console.error(err);
            return;
        }

        ReactDOM.render(
            React.createElement(Teams, resp.body),
            container
        );
    });
}

init();
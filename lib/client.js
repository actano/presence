import css from './views/styles.styl'
import agent from 'superagent'
import Teams from './views/teams.jsx'
import ReactDOM from 'react-dom'
import React from 'react'
import moment from 'moment'

function init() {
    var scriptTag = document.all[document.all.length-1];
    let src = scriptTag.src;
    src = src.substring(0, src.lastIndexOf('/') + 1);
    let container = scriptTag.parentElement;

    let dateInput = document.getElementById('dateinput');
    if (dateInput) {
        let dateVal = moment(dateInput.value).format('YYYY-MM-DD');
        dateInput.onblur = function(){
            let newVal = moment(dateInput.value).format('YYYY-MM-DD');
            if (newVal != dateVal) {
                fetch(newVal, () => {dateVal = newVal});
            }
        };
    }

    function fetch(date, cb = ()=>{}) {
        if (dateInput) {
            dateInput.disabled = true;
        }
        var request = agent.get(src);
        if (date) {
            request.query({date: date});
        }
        request.accept('application/json').end((err, resp) => {
            if (dateInput) {
                dateInput.disabled = false;
            }
            if (err) {
                console.error(err);
            } else {
                ReactDOM.render(
                    React.createElement(Teams, resp.body),
                    container
                );
            }
            cb(err);
        });
    }

    fetch();
}

init();
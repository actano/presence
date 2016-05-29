import store from './store'
import moment from 'moment'
import {actionCreator as changeDate} from './redux/date'
import client from './client'

let dateInput = document.getElementById('dateinput');

function trigger() {
    let dateVal = moment(dateInput.value).format('YYYY-MM-DD');
    store.dispatch(changeDate(dateVal));
}

dateInput.onblur = trigger;
trigger();
client();

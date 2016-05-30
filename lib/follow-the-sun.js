import store from './redux'
import moment from 'moment'
import {actionCreator as changeDate} from './redux/date'
import client from './client'

function trigger() {
    let dateVal = moment().format('YYYY-MM-DD');
    store.dispatch(changeDate(dateVal));
}

window.setInterval(trigger, 10000);
trigger();
client();

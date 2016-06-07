import store from './index'
import moment from 'moment'
import { actionCreator as changeDate } from './date'

function trigger() {
  const dateVal = moment().format('YYYY-MM-DD')
  store.dispatch(changeDate(dateVal))
}

export default function followTheSun() {
  window.setInterval(trigger, 10000)
  trigger()
}

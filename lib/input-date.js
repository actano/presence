import moment from 'moment'
import { connect } from 'react-redux'
import client from './client'
import store from './redux'
import { actionCreator as changeDate } from './redux/date'
import Form from './views/form'

const initialDate = moment().format('YYYY-MM-DD')
store.dispatch(changeDate(initialDate))

function mapStateToProps(state) {
  return {
    value: (state && state.date) || initialDate,
  }
}

function mapDispatchToProps() {
  return {
    onChangeDate: (date) => {
      const _moment = moment(date)
      if (_moment.isValid()) {
        store.dispatch(changeDate(_moment.format('YYYY-MM-DD')))
      }
    },
  }
}

const DateForm = connect(mapStateToProps, mapDispatchToProps)(Form)
client(DateForm)

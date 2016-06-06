import client from './client'
import Form from './views/form'
import { connect } from 'react-redux'
import moment from 'moment'
import store from './redux'
import { actionCreator as changeDate } from './redux/date'

const initialDate = moment().format('YYYY-MM-DD')
store.dispatch(changeDate(initialDate))

function mapStateToProps(state) {
  return {
    value: state && state.date || initialDate,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDate: (date) => {
      let _moment = moment(date)
      if (_moment.isValid()) {
        store.dispatch(changeDate(_moment.format('YYYY-MM-DD')))
      }
    },
  }
}

let DateForm = connect(mapStateToProps, mapDispatchToProps)(Form)
client(DateForm)

import React from 'react'
import moment from 'moment'
import store from '../store'
import {actionCreator as changeDate} from '../redux/date'

function trigger(event) {
    let dateVal = moment(event.target.value);
    if (dateVal.isValid()) {
        store.dispatch(changeDate(dateVal.format('YYYY-MM-DD')));
    }
}

const initialDate = moment().format('YYYY-MM-DD');
store.dispatch(changeDate(initialDate));

export default class Form extends React.Component {
    constructor() {
        super();
        this.state = {value: initialDate}
    }
    render() {
        return (
            <h1>
                Presence for <input
                    type="date"
                    value={this.state.value}
                    onBlur={trigger}
                    onChange={(event) => this.setState({value: event.target.value})}
            />
            </h1>
        );
    }
}
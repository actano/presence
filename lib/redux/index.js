import { createStore } from 'redux'

import {reducer as reduceServer} from './server'
import {reducer as reduceDate} from './date'

function combineReducers(...reducers) {
    return function reduce(state, action) {
        for (let reducer of reducers) {
            state = reducer(state, action);
        }
        return state;
    };
}

let reducer = combineReducers(reduceDate, reduceServer);

const store = createStore(reducer);

export default store

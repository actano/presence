import { createStore } from 'redux'

import {reducer as reduceTeams} from './teams'
import {reducer as reduceDate} from './date'

function combineReducers(...reducers) {
    return function reduce(state, action) {
        for (let reducer of reducers) {
            state = reducer(state, action);
        }
        return state;
    };
}

let reducer = combineReducers(reduceDate, reduceTeams);

const store = createStore(reducer);

export default store

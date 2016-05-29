// TODO move to webpack.config
import Immutable from 'seamless-immutable'
import {reducer as reduceTeams} from './teams'
import {reducer as reduceDate} from './date'

function combineReducers(reducers){
    let keys = Object.keys(reducers);
    for (let key of keys) {
        if (typeof reducers[key] !== 'function') {
            throw new Error(`${key}: ${typeof reducers[key]}`);
        }
    }

    return function(state, action) {
        for (let key of keys) {
            let localState = state ? state[key] : undefined;
            let newState = reducers[key](localState, action);
            if (newState !== localState) {
                state = state ? state.set(key, newState) : Immutable({[key]: newState});
            }
        }
        return state;
    }
}

export default combineReducers({
    server: reduceTeams,
    date: reduceDate
});

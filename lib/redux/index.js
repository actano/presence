import { createStore } from 'redux'

import { reducer as reduceServer } from './server'
import { reducer as reduceDate } from './date'

function combineReducers(...reducers) {
  return function reduce(state, action) {
    let _state = state
    for (const reducer of reducers) {
      _state = reducer(_state, action)
    }
    return _state
  }
}

const reducer = combineReducers(reduceDate, reduceServer)

const store = createStore(reducer)

export default store

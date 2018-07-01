import set from './set'

const ACTION = 'CHANGE_SERVER'

export function reducer(state, action) {
  if (action.type === ACTION) {
    return set(state, 'server', action.data)
  }
  return state
}

export function select(state) {
  return (state && state.server) || {}
}

export function actionCreator(data = {}) {
  return { type: ACTION, data }
}

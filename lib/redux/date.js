import set from './set'

const ACTION = 'CHANGE_DATE'

export function reducer(state, action) {
  if (action.type === ACTION) {
    return set(state, 'date', action.date)
  }
  return state
}

export function select(state) {
  return state && state.date
}

export function actionCreator(date) {
  return { type: ACTION, date: date ? String(date) : null }
}

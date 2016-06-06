import Immutable from 'seamless-immutable'

export default function set(state, property, value) {
  return state
        ? Immutable(state).set(property, value)
        : Immutable({ [property]: value })
}

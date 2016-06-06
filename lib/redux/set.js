import immutable from 'seamless-immutable'

export default function set(state, property, value) {
  return state
        ? immutable(state).set(property, value)
        : immutable({ [property]: value })
}

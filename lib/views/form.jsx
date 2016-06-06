import React, { PropTypes } from 'react'

export default class Form extends React.Component {
  constructor(props) {
    super(props)
    this.state = { value: props.value }
  }

  render() {
    return (
      <h1>
        Presence for <input
          type="date"
          value={this.state.value}
          onBlur={() => this.props.onChangeDate(this.state.value)}
          onChange={(event) => this.setState({ value: event.target.value })}
        />
      </h1>
    )
  }
}

Form.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeDate: PropTypes.func.isRequired,
}

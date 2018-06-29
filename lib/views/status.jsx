import PropTypes from 'prop-types'
import React from 'react'
import moment from 'moment'

export default function renderStatus(props) {
  return (
    <h2 className="error">Calendar failed: {props.status}, loading data from cache
      ({moment(props.lastModified).format('L LT')})
    </h2>
  )
}

renderStatus.propTypes = {
  status: PropTypes.string.isRequired,
  lastModified: PropTypes.any.isRequired,
}

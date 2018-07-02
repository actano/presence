import PropTypes from 'prop-types'
import React from 'react'
import moment from 'moment'

const renderStatus = ({ status, lastModified }) =>
  (
    <h2 className="error">Calendar failed: {status}, loading data from cache
      ({moment(lastModified).format('L LT')})
    </h2>
  )

renderStatus.propTypes = {
  status: PropTypes.string.isRequired,
  lastModified: PropTypes.number.isRequired,
}

export default renderStatus

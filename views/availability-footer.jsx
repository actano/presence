import React from 'react'

export default class AvailabilityFooter extends React.Component {
    render() {
        let avail = this.props.available;
        let total = this.props.total;
        let cols = this.props.cols;
        let width = `${avail/total * 100}%`;
        return (
            <tfoot>
            <tr>
                <td colSpan={cols}><div className="percentage" style={{width}}>{avail}/{total}d available</div></td>
            </tr>
            </tfoot>
        );
    }
}


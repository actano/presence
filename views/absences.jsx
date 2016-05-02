import React from 'react'

export default class Absences extends React.Component {
    render() {
        let absences = this.props.absences;
        let sob = this.props.startOfBusiness;
        let eob = this.props.endOfBusiness;
        eob -= sob;
        
        return (
            <div>
                {absences.map((a) => {
                    let start = Math.max(0, a.start - sob) / eob;
                    let end = Math.min(eob, a.end - sob) / eob;
                    
                    let top = `${start * 100}%`;
                    let height = `${(end - start) * 100}%`;
                    let className = a.className + ' status';
                    return (<span className={className} style={{top, height}} key={a.id}/>)
                })}
            </div>
        )
    }
}
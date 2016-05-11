import React from 'react'

export default class Absences extends React.Component {
    render() {
        let absences = this.props.absences;
        let sob = this.props.startOfBusiness;
        let eob = this.props.endOfBusiness;
        eob -= sob;
        
        return (
            <div>
                {absences.map((absence) => {
                    let start = Math.max(0, absence.start - sob) / eob;
                    let end = Math.min(eob, absence.end - sob) / eob;
                    
                    let top = `${start * 100}%`;
                    let height = `${(end - start) * 100}%`;
                    let className = `${absence.type} status`;
                    return (<span className={className} style={{top, height}} key={absence.id}/>)
                })}
            </div>
        )
    }
}
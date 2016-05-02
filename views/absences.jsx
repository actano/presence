import React from 'react'
import absenceClass from './absence-class'

export default class Absences extends React.Component {
    render() {
        let range = this.props.dateRange;
        let absences = this.props.absences;
        let sob = range.startOfBusiness;
        let eob = range.endOfBusiness;
        eob -= sob;

        function absencePercentage(startDate, endDate) {
            let zero = startDate.clone().startOf('day').add(sob, 'minutes');
            let start = Math.max(0, startDate.diff(zero, 'minutes'));
            let end = Math.min(eob, endDate.diff(zero, 'minutes'));
            return {
                start: start / eob,
                end: end / eob
            };
        }

        return (
            <div>
                {absences.map((absence) => {
                    let percentage = absencePercentage(absence.date, absence.day.endDate());
                    let top = `${percentage.start * 100}%`;
                    let height = `${(percentage.end - percentage.start) * 100}%`;
                    let className = [absenceClass(absence), 'status'].join(' ');
                    return (<span className={className} style={{top, height}} key={absence.event.icalEvent.uid}/>)
                })}
            </div>
        )
    }
}
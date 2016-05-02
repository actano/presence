export default function absenceClass(absence) {
    if (absence.isHoliday()) {
        return 'public-holiday';
    }
    if (absence.isTravel()) {
        return 'away';
    }
    return 'absent';
}
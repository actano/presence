const ACTION = 'CHANGE_DATE';

export const reducer = function (state, action) {
    if (action.type === ACTION) {
        state = action.date;
    }
    return state;
};

export const actionCreator = function changeDate(date) {
    date = date ? String(date) : null;
    return {type: ACTION, date}
};

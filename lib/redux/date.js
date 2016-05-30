const ACTION = 'CHANGE_DATE';
import set from './set';

export const reducer = function (state, action) {
    if (action.type === ACTION) {
        state = set(state, 'date', action.date);
    }
    return state;
};

export const select = function (state) {
    return state && state.date;
};

export const actionCreator = function changeDate(date) {
    date = date ? String(date) : null;
    return {type: ACTION, date}
};

import Immutable from 'seamless-immutable'

const ACTION = 'CHANGE_TEAMS';

export const reducer = function (state, action) {
    if (action.type === ACTION) {
        state = Immutable(action.data);
    }
    return state;
};

export const actionCreator = function changeTeams(data = {}) {
    return {type: ACTION, data}
};

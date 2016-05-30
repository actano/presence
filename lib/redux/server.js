import set from './set';

const ACTION = 'CHANGE_SERVER';

export const reducer = function (state, action) {
    if (action.type === ACTION) {
        state = set(state, 'server', action.data);
    }
    return state;
};

export const select = function (state) {
    return state && state.server || {}
};

export const actionCreator = function changeTeams(data = {}) {
    return {type: ACTION, data}
};

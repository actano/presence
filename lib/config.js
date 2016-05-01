import md5 from 'MD5'
import fs from 'fs'
import yaml from 'js-yaml'
import _urlify from 'urlify'
import url from 'url'
import moment from 'moment'

const urlify = _urlify.create({
    addEToUmlauts: true,
    szToSs: true,
    spaces: ".",
    nonPrintable: "_",
    trim: true
});

let _gravatarUrlFromName = null;

export default function config(date) {
    let isoDate = date.format('YYYY-MM-DD');

    let config = yaml.safeLoad(fs.readFileSync('teams.yml'));
    let removePrefix = config.removePrefix || ':';

    let applyDefaults = function(defaults, target) {
        for (let k in defaults) {
            let defaultValue = defaults[k];
            let current = target[k];
            if (current == null) {
                target[k] = defaultValue;
            } else if (Array.isArray(current) && Array.isArray(defaultValue)) {
                if (!current.length) {
                    target[k] = current;
                    continue;
                }
                let removes = {};
                let indices = [];
                let index = 0;
                for (let item of current) {
                    if (removePrefix === item.substring(0, removePrefix.length)) {
                        item = item.substring(removePrefix.length);
                        removes[item] = true;
                        indices.unshift(index);
                    }
                    index++;
                }
                for (let i of indices) current.splice(i, 1);
                defaultValue = defaultValue.filter(item => !removes[item]);
                target[k] = defaultValue.concat(current);
            } else if ((typeof current === 'object') && (typeof defaultValue === 'object')) {
                applyDefaults(defaultValue, current);
            }
        }
    };

    let teamMap = {};
    let sortedTeams = [];
    for (var from in config.teams) {
        var teams = config.teams[from];
        if (from > isoDate) { continue; }
        sortedTeams.push({from, teams});
    }
    sortedTeams.sort(function(a, b) {
        if (a.from < b.from) { return -1; }
        if (a.from > b.from) { return 1; }
        return 0;
    });

    for (let i = 0; i < sortedTeams.length; i++) {
        let sorted = sortedTeams[i];
        ({ from } = sorted);
        var { teams } = sorted;

        for (let j = 0; j < teams.length; j++) {
            var team = teams[j];
            let defaults = teamMap[team.name];
            if (defaults != null) { applyDefaults(defaults, team); }
            if (team.sprint == null) { team.sprint = {}; }
            if (team.sprint.startDate == null) { team.sprint.startDate = from; }
            teamMap[team.name] = team;
        }
    }

    config.teams = [];
    for (let name in teamMap) {
        var team = teamMap[name];
        applyDefaults(config.teamDefaults, team);
        if ((team.sprint != null) && team.sprint.startDate > isoDate) { continue; }
        if (team.members.length === 0) { continue; }
        team.calendar = url.resolve(config.calendarPrefix, team.calendar);
        team.members.sort((a,b) => a.localeCompare(b));
        config.teams.push(team);
    }

    config.teams.sort(function(a, b) {
        if (a.weight < b.weight) { return -1; }
        if (a.weight > b.weight) { return 1; }
        return a.name.localeCompare(b.name);
    });

    // set static function
    _gravatarUrlFromName = function(name) {
        let name_md5 = md5(urlify(name.toLowerCase()) + config.emailSuffix);
        return `${config.gravatarPrefix}${name_md5}`;
    };

    return config;
}

config.gravatarUrlFromName = function(name) {
    if (_gravatarUrlFromName == null) {
        // load some default config to init fn
        module.exports(moment());
    }
    return _gravatarUrlFromName(name);
};



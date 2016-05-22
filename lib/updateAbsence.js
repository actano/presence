import fs from 'fs';
import path from 'path';
import {coroutine, promisifyAll} from 'bluebird';
import _config from './config';
import icsFromURL from './ics-from-url';
import Calendar from './calendar';
import Team from './team';
import teamModel from './model'

promisifyAll(fs);

// load team meta data
export default coroutine(function*(userDate) {
    let config = _config(userDate);

    let holidayCalendarData = yield fs.readFileAsync(path.join(path.dirname(__dirname), 'calendars', 'public-holidays_de.ics'), 'utf-8');
    let holidayCalendar = new Calendar(holidayCalendarData);
    holidayCalendar.holidays = true;

    let results = [];
    for (let i = 0; i < config.teams.length; i++) {
        let team = config.teams[i];
        let teamCalendarData = yield icsFromURL(team.calendar);

        let result = new Team(team, userDate, holidayCalendar, new Calendar(teamCalendarData.content));
        result.cacheTimestamp = teamCalendarData.mtime;
        results.push(teamModel(result, userDate));
    }
    // yield fs.writeFileAsync('results.json', JSON.stringify(results));
    return results;
});

path = require 'path'

Promise = require 'bluebird'
Promise.longStackTraces()

moment = require 'moment'
express = require 'express'
stylus = require 'stylus'
autoprefixer = require 'express-autoprefixer'
seedrandom = require 'seedrandom'

isoDate = 'YYYY-MM-DD'
deDate = 'DD.MM.YYYY'

getAbsence = require './getAbsence'

app = express()

viewsDir  = path.join __dirname, 'views'
stylesDir = path.join __dirname, 'styles'
publicDir = path.join __dirname, 'public'

app.set 'views', viewsDir
app.set 'view engine', 'jade'

# prevents -> https://github.com/alubbe/memoryleak
if process.env.NODE_ENV and process.env.NODE_ENV isnt 'development'
    app.locals.compileDebug = false

app.use stylus.middleware src: stylesDir, dest: publicDir
app.use autoprefixer browsers: 'last 2 versions', cascade: false


# respond with rendered html
app.get '/', Promise.coroutine (req, res) ->
    teams = yield getAbsence req.query?.date
    teams = viewLogic teams

    res.render 'index',
        results: teams
        teams: teams
        isoDate: isoDate
        deDate: deDate

# respond with raw absence data
app.get '/json', Promise.coroutine (req, res) ->
    res.json yield getAbsence(req.query?.date)

app.use express.static publicDir

port = process.env.PORT or 3000

app.listen port, ->
    console.log "Listening on port #{port}..."

viewLogic = (teams) ->
    rng = null
    for team in teams
        team.cssClass = ['team']
        team.cssClass.push 'hasSprint' if team.sprint?
        team.cssClass.push 'scrum' if team.sprint?.scrum

        if team.sprint
            team.head = if team.sprint.scrum then 'Sprint' else 'Week'
            team.head += " #{team.sprint.count + 1}"

            sprintDays = Object.keys(team.queryDates).length
            sprintMembers = Object.keys(team.members).length
            sprintMemberDays = sprintDays * sprintMembers
            sprintMemberAvailabilities = Number(sprintMemberDays)

            avail = []

            for name, member of team.members
                todayAbsence = member.absences[team.date] ? 'todayAbsence' : null
                member.cssClass = [todayAbsence]
                member.dates = []
                for date in team.queryDates
                    status = null
                    description = null
                    absence = member.absences[date.format(isoDate)]
                    preWeekend = date.day() == 5 ? 'preWeekend' : null
                    postWeekend = date.day() == 1 ? 'postWeekend' : null

                    memberDate =
                        cssClass: [preWeekend, postWeekend]
                        date: date
                        description: description

                    if absence?
                        status = absence.status
                        if (status == 'absent' || status == 'public-holiday')
                            sprintMemberAvailabilities--
                        memberDate.description = absence.description
                        memberDate.cssClass.push status

                    if date.format(isoDate) == team.date
                        memberDate.content = member.name
                        avail.push member unless absence?
                    else if status == 'public-holiday'
                        memberDate.content = description
                    else
                        memberDate.content = date.format('dd., DD.M.')
                    member.dates.push memberDate

            if avail.length
                unless rng?
                    rng = seedrandom team.date
                selectedMember = avail[Math.floor(rng() * avail.length)]
                selectedMember.cssClass.push 'selected'
            team.summary =
                percentage: (sprintMemberAvailabilities / (sprintMemberDays / 100))
                memberAvailabilities: sprintMemberAvailabilities
                memberDays: sprintMemberDays

        else
            for member in team.members
                status = null
                description = null
                if member.absences[team.date]
                    status = member.absences[team.date].status
                    description = member.absences[team.date].description
                member.cssClass = [status]
                member.title = description


    teams
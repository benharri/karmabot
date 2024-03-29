require('dotenv').config()
let Flint = require('node-flint')
let webhook = require('node-flint/webhook')

let express = require('express')
let app = express()
let bodyparser = require('body-parser')
app.use(bodyparser.json())

let util = require('./utils')
let db = require('./db')


let flint = new Flint({
    webhookUrl: `${process.env.ENDPOINT}/flint`,
    token: process.env.BOT_TOKEN,
    messageFormat: 'markdown'
})

flint.start()
db.migrate()

util.log("bot starting")

flint.on('message', function(bot, trigger) {
    util.log(`message received from ${trigger.personDisplayName}`)

    if (trigger.mentionedPeople.length > 1) {
        // count the number of `+` and `-` symbols
        let karmacount = (trigger.text.match(/\+/g) || []).length - (trigger.text.match(/-/g) || []).length

        let limit = parseInt(process.env.KARMA_NO_FUN_LIMIT)
        if (karmacount > limit) {
            karmacount = limit
            bot.say(`# **BUZZKILL** mode activated. adding ${limit} karma.`)
        } else if (karmacount < (limit * -1)) {
            karmacount = limit * -1
            bot.say(`# **BUZZKILL** mode activated. removing ${limit} karma.`)
        }

        for (let i in trigger.mentionedPeople) {
            let person = trigger.mentionedPeople[i]
            if (util.is_self(person)) continue

            util.log(`looking up ${person}`)
            util.api_request('GET', `/people/${person}`, (success, json) => {
                const userparams = {
                    text: "SELECT karma from karma where user_id = $1",
                    values: [person]
                }
                util.log("userparams:", userparams)

                db.query(userparams)
                    .then(r => {
                        util.log("users found: ", r)

                        if (r.rowCount == 1) { // person exists
                            util.log(`${person} found in db`)
                            const params = {
                                text: "UPDATE karma set karma = $1 where user_id = $2",
                                values: [r.rows[0].karma + karmacount, person]
                            }
                            util.log("params: ", params)
                            db.query(params)

                            util.log(`${json.displayName} has ${r.rows[0].karma + karmacount} karma`)
                            bot.say(`${json.displayName} has ${r.rows[0].karma + karmacount} karma`)
                        }
                        else {
                            util.log(`creating user for ${json.displayName} ${person}`)
                            const params = {
                                text: "INSERT INTO karma(user_id, email, karma) VALUES($1, $2, $3)",
                                values: [person, json.emails[0], karmacount],
                            }
                            util.log("params: ", params)
                            let insert_rows = db.query(params)
                                .then(i => {
                                    util.log("rows inserted: ", i)
                                    if (i) {
                                        bot.say(`${json.displayName} has ${karmacount}`)
                                    } else {
                                        bot.say(`something went wrong`)
                                    }
                                })
                        }
                    })
            })
        }
    } else { // no mentions
        if (trigger.text.indexOf('leaderboard') > -1 && !util.is_self(trigger.personId)) {
            const leaderboardparams = {
                text: "SELECT karma, email, user_id from karma order by karma desc limit 10"
            }
            db.query(leaderboardparams)
                .then(r => {
                    let position = 1
                    let messagetext = "## karma leaderboard: top 10"
                    for (let row of r.rows) {
                        messagetext += `* ${position}: ${row.email} has ${row.karma}`
                        position++
                    }
                    bot.say(messagetext)
                    util.log("leaderboard: ", r)
                })
        }
    }
})


app.post('/flint', webhook(flint))

let server = app.listen(process.env.PORT || 5000, () => {
    util.log('flint listening on port %s', process.env.PORT || 5000)
})

process.on('SIGINT', function() {
    util.log('stopping...')
    server.close()
    flint.stop().then(function() {
        process.exit()
    })
})

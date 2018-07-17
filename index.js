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
    token: process.env.BOT_TOKEN
})

flint.start()
db.migrate()
db.query(`SELECT table_name
    FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
    AND table_schema NOT IN
        ('pg_catalog', 'information_schema');

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'karma'; `)


util.log("bot starting")

flint.hears('hello', function(bot, trigger) {
    util.log(`hello message received from ${trigger.personDisplayName}`)
    bot.say(`Hello ${trigger.personDisplayName}!`)
})

flint.hears('ping', function(bot, trigger) {
    util.log(`ping from ${trigger.personDisplayName}`)
    bot.say(`pong! ${trigger.personDisplayName}`)
})

flint.on('message', function(bot, trigger) {
    util.log(`message received from ${trigger.personDisplayName}`)

    if (trigger.mentionedPeople) {
        for (let i in trigger.mentionedPeople) {
            let person = trigger.mentionedPeople[i]
            if (util.is_self(person)) continue

            util.log(`looking up ${person}`)
            util.api_request('GET', `/people/${person}`, (success, json) => {
                if (success) bot.say(`you mentioned: ${json.displayName}`)

                const userparams = {
                    text: "SELECT karma from karma where user_id = $1",
                    values: [person]
                }
                util.log("userparams:", userparams)

                let rows = db.query(userparams)
                util.log("users found: ", rows)

                if (rows.length) { // person exists
                    util.log(`${person} found in db`)
                    const params = {
                        text: "UPDATE karma set karma = $1 where user_id = $2",
                        values: [rows[0] + 1, person]
                    }
                    util.log("params: ", params)
                    let result = db.query(params)

                    util.log(`${person} has ${rows[0] + 1} karma`)
                    bot.say(`${person} has ${rows[0] + 1} karma`)
                } else {
                    util.log(`creating user for ${person}`)
                    const params = {
                        text: "INSERT INTO karma(user_id, karma) VALUES($1, $2)",
                        values: [person, 0],
                    }
                    util.log("params: ", params)
                    let insert_rows = db.query(params)

                    util.log("rows inserted: ", insert_rows)
                    if (insert_rows) {
                        bot.say(`${json.displayName} has 0`)
                    } else {
                        bot.say(`something went wrong`)
                    }
                }
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

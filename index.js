require('dotenv').config()
var Flint = require('node-flint')
var webhook = require('node-flint/webhook')

var express = require('express')
var app = express()
var bodyparser = require('body-parser')
app.use(bodyparser.json())

var util = require('./utils')


var flint = new Flint({
    webhookUrl: `${process.env.ENDPOINT}/flint`,
    token: process.env.BOT_TOKEN
})

flint.start()
util.log("bot starting")

flint.hears('hello', function(bot, trigger) {
    bot.say(`Hello ${trigger.personDisplayName}!`)
    util.log(`hello message received from ${trigger.personDisplayName}`)
})

flint.hears('ping', function(bot, trigger) {
    bot.say(`pong! ${trigger.personDisplayName}`)
    util.log(`ping from ${trigger.personDisplayName}`)
})

flint.on('message', function(bot, trigger) {
    util.log(`message received from ${trigger.personDisplayName}`)

    if (trigger.mentionedPeople) {
        util.log(trigger.mentionedPeople)

        for (var i in trigger.mentionedPeople) {
            var person = trigger.mentionedPeople[i]
            if (util.is_self(person)) continue

            util.log(`looking up ${person}`)
            util.api_request('GET', `/people/${person}`, (success, json) => {
                if (success) bot.say(`you mentioned: *${json.displayName}*`)
            })
        }
    }
})


app.post('/flint', webhook(flint))

var server = app.listen(process.env.PORT || 5000, function() {
    util.log('flint listening on port %s', process.env.PORT || 5000)
})

process.on('SIGINT', function() {
    util.log('stopping...')
    server.close()
    flint.stop().then(function() {
        process.exit()
    })
})


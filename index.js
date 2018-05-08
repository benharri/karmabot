require('dotenv').config();
var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var request = require('request');
var bodyparser = require('body-parser');
var app = express();
app.use(bodyparser.json());

var flint = new Flint({
    webhookUrl: process.env.ENDPOINT + '/flint',
    token: process.env.BOT_TOKEN
});

flint.start();
console.log("bot starting");

flint.hears('hello', function(bot, trigger) {
    bot.say('Hello %s!', trigger.personDisplayName);
    console.log('hello message received from %s', trigger.personDisplayName);
});

flint.hears('ping', function(bot, trigger) {
    bot.say('pong! ~%s', trigger.personDisplayName);
    console.log('ping from %s', trigger.personDisplayName);
});

flint.on('message', function(bot, trigger) {
    console.log('message received from ' + trigger.personDisplayName);
    if (trigger.mentionedPeople) {
        console.log(trigger.mentionedPeople);
        bot.say('adding karma... you mentioned %s', trigger.mentionedPeople);
        for (var i in trigger.mentionedPeople) {
            var person = trigger.mentionedPeople[i];
            if (person == bot.id) continue;
            console.log(`looking up ${person}`);
            request({
                uri: `https://api.ciscospark.com/v1/people/${person}`,
                headers: {
                  'Authorization': `Bearer ${process.env.BOT_TOKEN}`,
                  'Content-Type': 'application/json; charset=utf-8'
                },
                method: 'GET'
            }, function (error, response, body) {
                console.log('error: ', error);
                console.log('statusCode: ', response && response.statusCode);
                console.log('body: ', body);
            });
        }
    }
});

app.post('/flint', webhook(flint));

var server = app.listen(process.env.PORT || 5000, function() {
    console.log('flint listening on port %s', process.env.PORT || 5000);
});

process.on('SIGINT', function() {
    console.log('stopping...');
    server.close();
    flint.stop().then(function() {
        process.exit();
    });
});


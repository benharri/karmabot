var request = require('request');

var self = module.exports = {
    api_request: (method, uri, callback) => {
        request({
            uri: `https://api.ciscospark.com/v1${uri}`,
            method: method,
            headers: {
              'Authorization': `Bearer ${process.env.BOT_TOKEN}`,
              'Content-Type': 'application/json; charset=utf-8'
            }
        }, (error, response, body) => {
            if (error) self.log('api request error:', error)
            self.log('statusCode:', response && response.statusCode)
            self.log('body: ', body)

            callback(response.statusCode == 200, JSON.parse(body))
        })
    },

    log: (...msg) => {
        if (process.env.DEBUG)
            console.log(...msg)
    },

    is_self: (id) => id == process.env.BOTT_ID
}

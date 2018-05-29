const { Client } = require('pg')
const util = require('./utils')
const fs = require('fs')

var self = module.exports = {
    setup_connection: () => new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    }),

    query: (sql) => {
        const client = self.setup_connection()

        client.connect()
        let result = [];
        client.query(sql, (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                util.log(row)
            }
            result = res.rows
            client.end()
        });
        return result
    },

    migrate: () => {
        const client = self.setup_connection()

        client.connect()

        let migrations = fs.readFileSync('./migrations.sql').toString()
        client.query(migrations, (err, res) => {
            if (err) {
                util.log(err.stack)
            } else {
                util.log(res.rows[0])
            }
        })
    }
}

const { Client } = require('pg')
const util = require('./utils')
const fs = require('fs')

var self = module.exports = {
    setup_connection: () => new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    }),

    query: async function (sql) {
        const client = self.setup_connection()
        client.connect()

        let res;
        try {
            res = await client.query(sql)
            util.log(res)
        } catch(err) {
            util.log(err.stack);
        }
        return res;
    },

    migrate: () => {
        const client = self.setup_connection()

        client.connect()

        let migrations = fs.readFileSync('./migrations.sql').toString()
        client.query(migrations, (err, res) => {
            if (err) {
                util.log(err.stack)
            } else {
                util.log(res.rows)
            }
        })
    }
}

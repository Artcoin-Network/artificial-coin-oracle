const sql = require('yesql')('./sql/', { type: 'pg' })
const dbConfigName = process.env.NODE_ENV || "dev"

let pg = require('pg')
const pool = (dbConfigName == "production") ?
    // pools will use environment variables
    new pg.Pool() :
    new pg.Pool(require("./database.json")[dbConfigName])

const txn = async (actions) => {
    // note: we don't try/catch this because if connecting throws an exception
    // we don't need to dispose of the client (it will be undefined)
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        await actions(client)
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

module.exports = { pool, txn, sql, dbConfigName }
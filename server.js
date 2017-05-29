const assert = require('assert')
const express = require('express')
const cors = require('cors')

const db = require('mongoennung')

const PORT = process.env.PORT || 8080
const DB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/flyer'

db.connect(DB_URL, startServer)

function startServer(err) {
    assert.ifError(err)

    const updateEvents = require('./prismic')
    setInterval(updateEvents, 30000)
    updateEvents()

    var app = express()
    app.use(cors())
    app.use('/api', require('./controllers'))

    var server = app.listen(PORT, function(){
        var host = server.address().address
        var port = server.address().port

        console.log('Listening on' + host + ':' + port)
    })
}

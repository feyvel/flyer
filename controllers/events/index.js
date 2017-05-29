const router = require('express').Router()
const assertError = require('assert').ifError
const bodyParser = require('body-parser')

const jsonSchemaMiddleware = require('json-schema-validation-middleware')
const db = require('mongoennung')

const collection = db.collection('events')

router.use(bodyParser.json({ strict: false }))
router.use(userMiddleware)
router.param('id', idMiddleware)

router.route('/')
    .get(handleGetAll)

router.route('/:id')
    .patch(handlePatch)
    .get(handleGetOne)

function handlePatch(req, res) {
    if(typeof req.body != 'boolean')
        return res.status(400).send('Expected boolean body')

    var isSignedUp = req.event.signups.indexOf(req.userId) != -1
    var wantsToSignUp = req.body

    if(isSignedUp == wantsToSignUp)
        return res.status(200).send('')

    if(wantsToSignUp && req.event.capacity <= req.event.signups.length)
        return res.status(409).send('')

    function onUpdated(err) {
        if(err != null)
            return res.status(500).send(err)

        return res.status(200).send('')
    }

    var update = {}
    var setField = { signups: req.userId }

    if(wantsToSignUp)
        update.$push = setField
    else
        update.$pull = setField

    return collection.updateOne(
        { _id: req.event._id },
        update,
        onUpdated
    )
}

function handleGetOne(req, res) {
    return res.status(200).json(req.event)
}

function handleGetAll(req, res) {
    collection
        .find({})
        .toArray()
        .then(function respond(results) {
            return res.status(200).json(results)
        })
        .catch(function respondWithError(err) {
            return res.status(500).json(err)
        })
}

function userMiddleware(req, res, next) {
    //TODO: Determine which user is requesting
    var userId = 'changeme' //<-- change

    if(false && cannotDetermineUser) //<-- change to condition, if the user can not be authorized
        return res.status(403).send('')

    req.userId = userId

    next()
}

function idMiddleware(req, res, next, id) {
    collection.findOne({ _id: id }, onFind)

    function onFind(err, result) {
        assertError(err)

        if(!result)
            res.status(404).send()

        req.event = result

        next()
    }
}

module.exports = router

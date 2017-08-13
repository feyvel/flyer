var router = require('express').Router()

router.use('/events', require('./events'))
router.use('/header', require('./header'))

module.exports = router

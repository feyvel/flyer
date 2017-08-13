const Prismic = require('prismic.io')
const router = require('express').Router()

router.route('/')
    .get(handleGetHeader)

function handleGetHeader(req, res) {
    Prismic
        .api('http://goethe-flyer.prismic.io/api')
        .then(function fetchHeader(api) {
            return api.query(
                Prismic.Predicates.at('document.type', 'header')
            )
        })
        .then(function transformToHtml(page) {
            const html = page.results[0]
                .getStructuredText('header.content')
                .asHtml()

            res.status(200).send(html)
        })
        .catch(function error(reason) {
            console.error(reason)
            res.status(500).send(reason)
        })
}

module.exports = router

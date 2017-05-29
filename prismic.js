const Prismic = require('prismic.io')
const Promise = require('promise')
const db = require('mongoennung')

const collection = db.collection('events')

function updateEvents() {
    function updateEvent(event) {
        return collection
            .findOne({ _id: event.uid })
            .then(function decideAction(result) {
                if(result)
                    return collection.updateOne(
                        { _id: event.uid },
                        {
                            $set: {
                                name: event.getText('event.name'),
                                capacity: event.getNumber('event.capacity'),
                                description: event.getStructuredText('event.description').asText(),
                                begins: event.getDate('event.begins'),
                                ends: event.getDate('event.ends')
                            }
                        }
                    )
                else
                    return collection.insertOne({
                        _id: event.uid,
                        name: event.getText('event.name'),
                        capacity: event.getNumber('event.capacity'),
                        description: event.getStructuredText('event.description').asText(),
                        signups: [],
                        begins: event.getDate('event.begins'),
                        ends: event.getDate('event.ends')
                    })
            })
            .catch(console.warn)
    }

    return Prismic
        .api('http://goethe-flyer.prismic.io/api')
        .then(function fetchEvents(api) {
            console.log('Fetching events...')

            return api.query(Prismic.Predicates.at('document.type', 'event'))
        })
        .then(function updateDatabase(page) {
            console.log('...updating database...')

            return Promise.all(page.results.map(updateEvent))
        })
        .then(function logSuccess() {
            console.log('...done')
        })
}

module.exports = updateEvents

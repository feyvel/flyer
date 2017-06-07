const Prismic = require('prismic.io')
const Promise = require('promise')
const db = require('mongoennung')

const eventCollection = db.collection('events')

function updateEvents() {
    function updateEvent(event) {
        return eventCollection
            .findOne({ _id: event.uid })
            .then(function decideAction(result) {
                function transformToInner(prismicEvent) {
                    return {
                        name: prismicEvent.getText('event.name'),
                        capacity: prismicEvent.getNumber('event.capacity'),
                        description: prismicEvent.getStructuredText('event.description').asText(),
                        begins: prismicEvent.getTimestamp('event.begins'),
                        ends: prismicEvent.getTimestamp('event.ends'),
                        location: prismicEvent.getText('event.location'),
                        email: prismicEvent.getText('event.contact-email'),
                        contactName: prismicEvent.getText('event.contact-name')
                    }
                }

                if(result) {
                    return eventCollection.updateOne(
                        { _id: event.uid },
                        {
                            $set: transformToInner(event)
                        }
                    )
                } else {
                    let myEvent = transformToInner(event)
                    myEvent._id = event.uid
                    myEvent.signups = []

                    return eventCollection.insertOne(myEvent)
                }
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

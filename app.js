var root = $('html, body')

var userId = 'changeme'
var events = []

$.getJSON('http://localhost:8080/api/events', function(data) {
    events.push(...data)
    console.dir(events)
})

function scrollToAnchor(hash) {
    root.animate(
        { scrollTop: $(hash).offset().top },
        700,
        function() {
            window.location.hash = hash
        }
    )
}

$('a[href^=\\#]').on('click', function(e) {
    e.preventDefault()

    var hash = this.hash

    scrollToAnchor(hash)
})

new Vue({
    el: '#events',
    data: {
        events: events,
        failures: {},
        userId: userId
    },
    methods: {
        patchSignUpStatus: function patchSignUpStatus(id, status) {
            var self = this

            $.ajax({
                headers : {
                    'Accept' : 'application/json',
                    'Content-Type' : 'application/json'
                },
                url : 'http://localhost:8080/api/events/' + id,
                type : 'PATCH',
                data : JSON.stringify(status),
                success : function updateSignupStatus() {
                    self.events.some(function(event) {
                        if(event._id != id)
                            return false

                        if(status)
                            event.signups.push(this.userId)
                        else
                            event.signups.splice(event.signups.indexOf(self.userId), 1)

                        return true
                    })
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    self.failures[id] = true
                }
            })
        }.bind(this),
        signUp: function signUp(id) {
            this.patchSignUpStatus(id, true)
        },
        signOff: function signOff(id) {
            this.patchSignUpStatus(id, false)
        }
    }
})

new Vue({
    el: '#calendar',
    data: {
        events: events,
        days: [],
        dayNames: [
            'Sonntag',
            'Montag',
            'Dienstag',
            'Mittwoch',
            'Donnerstag',
            'Freitag',
            'Samstag'
        ]
    },
    mounted: function mounted() {
        var start = moment().hours(0).minutes(0).seconds(0)

        for(var i = 0; i < 7; i++) {
            var actDay = start.clone().add(i, 'days')

            this.days.push({
                moment: actDay,
                events: this.events.filter(function happensAtCurrentDay(event) {
                    return moment(event.begins).day() == actDay.day()
                })
            })
        }
    },
    methods: {
        getRandomOffset: function getRandomOffset() {
            return Math.floor(Math.random() * 16 + 1)
        },
        getRandomLength: function getRandomLength() {
            return Math.floor(Math.random() * 7 + 1)
        },
        getRandomEventClasses: function getRandomEventClasses() {
            return 'event span-' + this.getRandomLength() + '-slots offset-' + this.getRandomOffset() + '-slots'
        }
    }
})

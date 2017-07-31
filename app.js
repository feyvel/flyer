var root = $('html, body')

var API_HOST = 'http://localhost:8080'
var credentials = {
    email: '',
    password: ''
}
var events = []

function isLoggedIn() {
    return credentials.email && credentials.password
}

function requestError(reason) {
    console.error('Request failed')
    console.error('reason')
}

function scrollToAnchor(hash) {
    root.animate(
        { scrollTop: $(hash).offset().top },
        700,
        function() {
            window.location.hash = hash
        }
    )
}

function buildBasicAuthheader(user, password) {
    return 'Basic ' + btoa((user || credentials.email) + ':' + (password || credentials.password))
}

function request(url, success, error, data) {
    return $.ajax({
        url: url,
        type: data ? 'POST' : 'GET',
        headers: {
            'Authorization': buildBasicAuthheader()
        },
        success: success,
        error: error,
        dataType: 'json'
    })
}

new Vue({
    el: '[login]',
    data: {
        email: '',
        password: '',
        loginError: false,
        loggedIn: false
    },
    methods: {
        login: function login() {
            var self = this

            self.loginError = false

            $.ajax({
                url: API_HOST + '/api/events',
                type: 'GET',
                headers: {
                    'Authorization': buildBasicAuthheader(self.email, self.password)
                },
                success: function(data) {
                    events.push(...data)

                    credentials = {
                        email: self.email,
                        password: self.password
                    }

                    self.loggedIn = true
                },
                error: function setLoginError() {
                    self.loginError = true
                },
                dataType: 'json'
            })
        }
    }
})

new Vue({
    el: '#events',
    data: {
        events: events,
        failures: {},
        userId: credentials.email
    },
    methods: {
        patchSignUpStatus: function patchSignUpStatus(id, status) {
            var self = this

            $.ajax({
                headers : {
                    'Accept' : 'application/json',
                    'Content-Type' : 'application/json',
                    'Authorization': buildBasicAuthheader()
                },
                url : API_HOST + '/api/events/' + id,
                type : 'PATCH',
                data : JSON.stringify(status),
                success : function updateSignupStatus() {
                    self.events.some(function(event) {
                        if(event._id != id)
                            return false

                        if(status)
                            event.signups.push(credentials.email)
                        else
                            event.signups.splice(event.signups.indexOf(credentials.email), 1)

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
        },
        getTimeSpanString: function getTimeSpanString(event) {
            return moment(event.begins).format('dddd, HH:mm')
                + ' - '
                + moment(event.ends).format('HH:mm')
        }
    }
})

new Vue({
    el: '#calendar',
    data: {
        events: events,
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
    computed: {
        days: function days() {
            var ret = []
            var start = moment('2017-05-29').hours(0).minutes(0).seconds(0)

            for(var i = 0; i < 7; i++) {
                var actDay = start.clone().add(i, 'days')

                ret.push({
                    moment: actDay,
                    events: this.events.filter(function happensAtCurrentDay(event) {
                        return moment(event.begins).date() == actDay.date()
                    })
                })
            }

            return ret
        }
    },
    methods: {
        getOffset: function getOffset(event) {
            var begins = moment(event.begins)

            var ret = (begins.hours() - 8) * 2

            if(begins.minutes() > 29)
                ret += 1

            return ret
        },

        getLengthInSlots: function getLengthInSlots(event) {
            return Math.ceil(
                moment(event.ends).diff(moment(event.begins), 'minutes') / 30
            )
        },

        getEventClasses: function getRandomEventClasses(event) {
            return 'event span-' + this.getLengthInSlots(event) + '-slots offset-' + this.getOffset(event) + '-slots'
        },

        scrollTo: function scrollTo(event) {
            scrollToAnchor('#' + event._id)
        }
    }
})

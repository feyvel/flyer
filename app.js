var root = $('html, body')

var API_HOST = 'http://localhost:8080'
var credentials = {
    email: '',
    password: ''
}
var events = []

function isLoggedIn() {
    return credentials.email.length > 0 && credentials.password.length > 0
}

function requestError(reason) {
    console.error('Request failed')
    console.error(reason)
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
                    data = data.sort(function compareNames(a, b) {
                        if (a.category < b.category)
                            return -1

                        if (a.category > b.category)
                            return 1

                        return 0
                    })

                    for (var i = 0; i < data.length; i++)
                        events.push(data[i])

                    credentials.email = self.email
                    credentials.password = self.password

                    self.loggedIn = true
                },
                error: function setLoginError() {
                    self.loginError = true
                },
                dataType: 'json'
            })
        },
        isEmailInputValid: function isEmailInputValid() {
            var validity = document.getElementById('email-input').validity

            return !validity.valueIsMissing && validity.valid
        }
    }
})

new Vue({
    el: '[events]',
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
            return moment(event.begins).format('dddd DD.MM, HH:mm')
                + ' - '
                + moment(event.ends).format('HH:mm')
        },
        isSignedUp: function isSignedUp(event) {
            return event.signups.indexOf(credentials.email) != -1
        },
        isFull: function isFull(event) {
            return event.signups.length >= event.capacity
        },
        getFontColor: function getFontColor(event) {

        },
        isDark: function isDark(event) {
            if (!event.color)
                return false

            return !tinycolor(event.color).isLight()
        }
    },
    computed: {
        mySignups: function getMySignups() {
            return this
                .events
                .filter(function isSignedUp(event) {
                    return event.signups.indexOf(credentials.email) != -1
                })
                .map(function getName(event) {
                    return event.name
                })
        }
    }
})

new Vue({
    el: '[calendar]',
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
            var start = moment('2017-10-09').hours(0).minutes(0).seconds(0)

            for (var i = 0; i < 10; i++) {
                var actDay = start.clone().add(i, 'days')

                ret.push({
                    moment: actDay,
                    events: this
                        .events
                        .filter(function happensAtCurrentDay(event) {
                            return moment(event.begins).dayOfYear() == actDay.dayOfYear()
                        })
                        .sort(function compare(a, b) {
                            return moment(a.begins).diff(moment(b.begins))
                        })
                })
            }

            return ret
        }
    },
    methods: {
        getOffset: function getOffset(event) {
            var begins = moment(event.begins)

            var ret = (begins.hours() - 13) * 2

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

new Vue({
    el: '[header]',
    data: {
        content: ''
    },
    mounted: function mounted() {
        var self = this

        function success(data) {
            self.content = data
        }

        return $.ajax({
            url: API_HOST + '/api/header',
            type: 'GET',
            headers: {
                'Authorization': buildBasicAuthheader()
            },
            success: success
        })
    }
})

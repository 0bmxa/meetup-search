$('#datepickerScript').ready(() => {
    let now = new Date()
    let timeNow = now.getTime()
    let timeIn5Days = timeNow  +  5*24*3600*1000
    let in5Days  = new Date(timeIn5Days)
    $('#filterEndDate').val(in5Days.toLocaleDateString())

    let timeIn14Days = timeNow + 14*24*3600*1000
    let in14Days = new Date(timeIn14Days)
    if($('#filterEndDate')[0].type != 'date') {
        $('#filterEndDate').datepicker({
            startDate: now,
            endDate: in14Days
        });
    }
})

var App = function() {
    let apiToken = null

    this.start = function() {
        setupAPIToken()
    }

    let setupAPIToken = function() {
        // get from storage
        let token = store.get('MeetupAPIToken')
        if (token != null) {
            apiToken = token
            return
        }

        // or ask user
        let promptMessage = 'To use this app you need a Meetup API token.\n' +
            'Get yours here: https://meetup.com/meetup_api/key/ .'
        let userInput = prompt(promptMessage)
        if (userInput == null || userInput.length < 20) {
            alert('No valid API token provided. The App will probably not work now.')
            return
        }

        // store & use token
        store.set('MeetupAPIToken', userInput)
        if (store.get('MeetupAPIToken') !== userInput) {
            let message =
                'Storing API token failed. '+
                'You can use the token in this session, but you have to enter it next time again.'
            if (location.protocol === 'file:') {
                message += '\n\nLocal Storage is not supported on "file:" URLs.'
            }
            alert(message)
        }
        apiToken = userInput
    }

    /*
        * Location search
        * =====================================================================
        */

    this.initLocationSearch = function() {
        let textField = $('#searchLocationTextField')[0]
        let autocomplete = new google.maps.places.Autocomplete(textField)
        autocomplete.setTypes(['geocode'])
        autocomplete.addListener('place_changed', () => {
            let place = autocomplete.getPlace()
            if (place.geometry == null) { $('#output').html(''); return; }
            let lat = place.geometry.location.lat(),
                lon = place.geometry.location.lng()
            searchMeetup(lat, lon)
        });
    }


    let searchMeetup = function(lat, lon) {
        let url = 'https://api.meetup.com/find/events?key=' + apiToken +
            '&only=name,time,group.name,link'
        let data = {
            url: url,
            data: {lat: lat, lon: lon},
            dataType: "jsonp",
            jsonpCallback: 'fnsuccesscallback'
        }
        jQuery.ajax(data)
            .done(response => showResults(response.data))
            .fail(response => showError(response))
    }



    /*
        * "UI" Stuff
        * =====================================================================
        */

    let showResults = function(events) {
        let output = $('#output')
        output.html('')
        if (events.length == 0) {
            output.append(
                '<div class="alert alert-danger" role="alert">' +
                    'No Meetups found.' +
                '</div>'
            )
            return
        }
        events.forEach(event => {
            let eventDate = (new Date(event.time)).toLocaleString()
            output.append(
                '<div class="card alert-success mycard m-2">'+
                    '<a href="' + event.link + '" class="card-block">' +
                        '<p class="card-text">' + eventDate + '</p>' +
                        '<h6 class="card-subtitle mb-2 text-muted max-1-line">' + event.group.name + '</h6>' +
                        '<small class="max-2-lines">' + event.name + '</small>' +
                    '</a>' +
                '</div>'
            )
        })
    }

    let showError = function(message) {
        if(typeof(message) === "object") {
            message = JSON.stringify(message)
        }
        $('#output').text('ERROR: ' + message)
    }
}



const app = new App();

$(document).ready(() => app.start() )

// Forwards the call
function initLocationSearch() {
    app.initLocationSearch();
}
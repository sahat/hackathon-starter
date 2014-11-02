$(document).ready(function() {

    var apiKey = 'AIzaSyAdjHPT5Pb7Nu56WJ_nlrMGOAgUAtKjiPM';
    var scopes = 'https://www.googleapis.com/auth/plus.me';
    var day = $('#eventform').find('input[name="day"]').val();
    console.log(day);
    gapi.client.load('calendar', 'v3').then(function() { console.log('loaded.'); });

    // function handleClientLoad() {
    //     gapi.client.setApiKey(apiKey);
    //     window.setTimeout(checkAuth,1);
    // }

    // function checkAuth() {
    //     gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
    // }

    // function handleAuthResult(authResult) {
    //     var authorizeButton = document.getElementById('authorize-button');
    //     if (authResult && !authResult.error) {
    //         authorizeButton.style.visibility = 'hidden';
    //         makeApiCall();
    //     } else {
    //         authorizeButton.style.visibility = '';
    //         authorizeButton.onclick = handleAuthClick;
    //     }
    // }

    // function handleAuthClick(event) {
    //     gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
    //     return false;
    // }

    // function makeApiCall() {
    //     gapi.client.load('calendar', 'v3').then(function() {
    //         day = $(#event_form).find('input[name=day"]').val();
    //         console.log(day);
    //         var check = {
    //             items: [{id: userCalID}],
    //             timeMax: req.body.day + "T23:59:00-04:00", // hardcode range to 7am to 11:59pm
    //             timeMin: req.body.day + "T06:59:00-04:00",
    //             timeZone: "-04:00"
    //         };
    //         var request = gapi.client.calendar.Freebusy.query(check, function(response){
    //             console.log(response)
    //         });
    //         request.then(function(resp) {
    //             var heading = document.createElement('h4');
    //             var image = document.createElement('img');
    //             image.src = resp.result.image.url;
    //             heading.appendChild(image);
    //             heading.appendChild(document.createTextNode(resp.result.displayName));

    //             document.getElementById('content').appendChild(heading);
    //         }, function(reason) {
    //             console.log('Error: ' + reason.result.error.message);
    //         });
    //     });
    // }
});

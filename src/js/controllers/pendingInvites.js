// start of buddies
var PendingInvitesController = function(){
    'use strict';

    ReactDOM.render(
        React.createElement(PendingInvitesR, {
            upcoming : [],
            pendingBuddyRequests : []
        }),
        document.getElementById(window.APP.mounts.buddiesMount)
    );

    var pendingSessions = new Invites(),
        pendingBuddies = new PendingBuddies();

    pendingBuddies
        .fetch()
        .done(function(response){
            events.publish('buddies/pendingRequests', response.buddies);
        });

    pendingSessions
        .fetch()
        .done(function(response){
            events.publish('buddies/upcomingInvites', response.invites);
        });

};
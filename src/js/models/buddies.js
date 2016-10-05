// buddies
var Buddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies',
    url: function() {
        return this.urlRoot;
    }
});

var PendingBuddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies/pendingRequests',
    url: function() {
        return this.urlRoot;
    }
});
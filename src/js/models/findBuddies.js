// Find Buddies
var FindBuddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies/find',
    url: function() {
        return this.urlRoot;
    }
});
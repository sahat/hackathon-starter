// buddies
var Invites = Backbone.Model.extend({
    urlRoot: '/api/v1/invites',
    url: function() {
        return this.urlRoot;
    }
});
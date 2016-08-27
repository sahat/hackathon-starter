// buddies
var Buddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies',
    url: function() {
        return this.urlRoot;
    }
});
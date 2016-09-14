
var AppRouter = Backbone.Router.extend({
    routes: {
        "invite": "invite",
        "find": "find",
        "*actions": "defaultRoute"
        // matches http://example.com/#anything-here
    }
});

// Initiate the router
var app_router = new AppRouter;

app_router.on('route:find', function(actions) {
    FindBuddiesController();
});

app_router.on('route:invite', function(actions) {
    console.log('INVITE!!!!')
    InviteController();
});

app_router.on('route:defaultRoute', function(actions) {
    AllBuddiesController();
});

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start();


// Global React components for admin/buddy area

//Load auth navigation
ReactDOM.render(
    React.createElement(AuthNav, null),
    document.getElementById(window.APP.mounts.adminMount));

ReactDOM.render(
    React.createElement(MessageMicro),
    document.getElementById('auth-message'));

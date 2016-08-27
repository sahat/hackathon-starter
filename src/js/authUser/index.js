
var AppRouter = Backbone.Router.extend({
    routes: {
        "invite": "inviteBuddies",
        "*actions": "defaultRoute"
        // matches http://example.com/#anything-here
    }
});
// Initiate the router
var app_router = new AppRouter;

app_router.on('route:defaultRoute', function(actions) {
    console.log(actions);
    clear();
    admin();
    buddiesController();
});

app_router.on('route:inviteBuddies', function(actions) {
    console.log(actions);
    clear();
    admin();
    buddiesController();
});

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start();


function clear(){
    $('#buddies').html('');
}

function admin(){
    console.log('admin');

    ReactDOM.render(React.createElement(AuthNav, null), document.getElementById('admin'));
}

// end of buddies
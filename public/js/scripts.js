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
// Find Buddies
var FindBuddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies/find',
    url: function() {
        return this.urlRoot;
    }
});
// buddies
var Invites = Backbone.Model.extend({
    urlRoot: '/api/v1/invites',
    url: function() {
        return this.urlRoot;
    }
});
// start of buddies
var AllBuddiesController = function(){

    var buddiesList = new Buddies(); // models/buddies.js
console.log('All buddies controller!')
    buddiesList
        .fetch()
        .done(function(buddies){
            ReactDOM.render(
                React.createElement(AuthBuddies, { buddies: buddiesList.toJSON().buddies }),
                document.getElementById(window.APP.mounts.buddiesMount) //
            );
        });

};
// start of buddies
var FindBuddiesController = function(){

    //Find Buddies
    ReactDOM.render(
        React.createElement(FindBuddiesR, null),
        document.getElementById(window.APP.mounts.buddiesMount)
    );

};
// start of buddies
var InviteController = function(){



    ReactDOM.render(
        React.createElement(InviteBuddiesR, null),
        document.getElementById(window.APP.mounts.buddiesMount) //
    );

};
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
var AuthNav = React.createClass({
    updateController: function (controller) {
        console.log(this);
        window.location.hash = controller;
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "invites") },
                "Pending"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "buddies") },
                "My Buddies"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "invite") },
                "Invite"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "find") },
                "Find a Buddy"
            )
        );
    }
});
var AuthBuddies = React.createClass({
    getInitialState: function () {
        return {
            buddies: this.props.buddies,
            buddiesPresent: this.props.buddies.length > 0 ? true : false,
            inviteTemplate: typeof this.props.requestType !== 'undefined' && this.props.requestType === 'find' ? true : false
        };
    },
    componentDidMount: function () {
        var self = this;
        events.subscribe('findBuddies/result', function (buddiesList) {
            self.setState({
                buddies: buddiesList.buddies,
                buddiesPresent: buddiesList.buddies.length > 0 ? true : false,
                inviteTemplate: buddiesList.requestType === 'find' ? true : false
            });
        });
    },
    handleBuddiesChange: function () {
        return { buddies: this.props.buddies };
    },
    render: function () {
        var self = this;
        return React.createElement(
            'div',
            { className: 'buddies-main' },
            self.state.inviteTemplate ? React.createElement('h2', null) : React.createElement(
                'h2',
                null,
                'Your Buddies'
            ),
            this.state.buddiesPresent ? this.state.buddies.map(function (buddy, index) {
                return React.createElement(
                    'div',
                    { className: 'BuddiesWrapper' },
                    self.state.inviteTemplate ? React.createElement(BuddyInvite, { key: index, buddy: buddy }) : React.createElement(BuddyRow, { key: index, buddy: buddy })
                );
            }) : React.createElement('div', { className: 'no-buddies' })
        );
    }
});
var FindBuddiesR = React.createClass({
    getInitialState: function () {
        return { buddies: {} };
    },
    findBuddies: function () {
        var self = this;
        $.get('/api/v1/buddies/find/' + this.state.buddyDetail, function (response) {
            self.setState({
                buddies: response.buddies
            });
            events.publish('findBuddies/result', { buddies: self.state.buddies, requestType: 'find' });
        });
    },
    handleTextChange: function (event) {
        this.setState({ buddyDetail: event.target.value });
    },
    render: function () {
        var self = this; // eww gross; never again. Must use es6.
        return React.createElement(
            'div',
            null,
            React.createElement(
                'h2',
                null,
                'Connect with a Buddy'
            ),
            React.createElement(
                'section',
                { className: 'form-group' },
                React.createElement('input', { className: 'form-control', type: 'text', placeholder: 'Type here', onChange: this.handleTextChange }),
                React.createElement(
                    'button',
                    { className: 'form-control', onClick: this.findBuddies.bind(this) },
                    'Find'
                ),
                React.createElement(AuthBuddies, { buddies: self.state.buddies })
            )
        );
    }
});
var BuddyRow = React.createClass({
    render: function () {
        return React.createElement(
            "section",
            { className: "buddy" },
            this.props.buddy.email,
            " | ",
            this.props.buddy.status,
            " ",
            React.createElement(InviteBuddyMicro, { buddy: this.props.buddy })
        );
    }
});
var BuddyInvite = React.createClass({
    render: function () {
        return React.createElement(
            "section",
            { className: "buddy" },
            this.props.buddy.email,
            " ",
            React.createElement(InviteBuddyMicro, { buddy: this.props.buddy, msg: "Connect" })
        );
    }
});
var InviteBuddiesR = React.createClass({
    getInitialState: function () {
        return { buddyDetail: '' };
    },
    handleTextChange: function (event) {
        this.setState({ buddyDetail: event.target.value });
    },
    sendInvite: function () {

        var self = this;

        $.ajax({
            url: '/api/v1/buddies/invite',
            data: { buddyEmail: self.state.buddyDetail }
        }).done(function (response) {
            events.publish('admin/alert', { className: 'text-success', msg: JSON.stringify(response) });
        }).fail(function (response) {
            events.publish('admin/alert', { className: 'text-danger', msg: JSON.stringify(response) });
        });
    },
    render: function () {
        var self = this; // eww gross; never again. Must use es6.
        return React.createElement(
            'inviteForm',
            { className: 'form-group' },
            React.createElement(
                'h2',
                null,
                'Invite a buddy to join'
            ),
            React.createElement('input', { className: 'form-control', type: 'text', placeholder: 'Email address', onChange: this.handleTextChange }),
            React.createElement(
                'button',
                { className: 'form-control', onClick: this.sendInvite.bind(this) },
                'Send invite'
            )
        );
    }
});
var PendingInvitesR = React.createClass({
    getInitialState: function () {
        return {
            invites: this.props.upcoming,
            pendingBuddyRequests: this.props.pendingBuddyRequests
        };
    },
    componentDidMount: function () {

        var self = this;

        events.subscribe('buddies/pendingRequests', function (pendingRequests) {
            self.setState({ pendingBuddyRequests: pendingRequests });
        });

        events.subscribe('buddies/upcomingInvites', function (upcomingInvites) {
            self.setState({ invites: upcomingInvites });
        });
    },
    render: function () {
        console.log(this);
        return React.createElement(
            'div',
            null,
            React.createElement(
                'h2',
                null,
                'Upcoming Sessions'
            ),
            React.createElement(
                'h2',
                null,
                'Pending Invites'
            ),
            this.state.pendingBuddyRequests.map(function (buddy, index) {
                return React.createElement(ApproveBuddyMicro, { key: index, buddy: buddy });
            })
        );
    }
});

var ApproveBuddyMicro = React.createClass({

    getInitialState: function () {
        return { buddy: this.props.buddy };
    },
    handleInvite: function (approvedStatus) {
        'use strict';

        var buddy = this.props.buddy;
        $.ajax({
            url: '/api/v1/invites/respond',
            method: 'POST',
            data: {
                buddyId: buddy._id,
                approved: approvedStatus,
                _csrf: APP._csrf
            }
        }).success(function (response) {
            events.publish('admin/alert', { className: 'text-success', msg: 'Buddy request was approved' });
        }).fail(function (response) {
            events.publish('admin/alert', { className: 'text-danger', msg: 'There was a problem approving buddy invite. Please try again.' });
        });
    },
    render: function () {
        var buddy = this.state.buddy;
        return React.createElement(
            'section',
            null,
            buddy.profile.name,
            React.createElement(
                'button',
                { onClick: this.handleInvite.bind(this, true) },
                'Approve'
            ),
            React.createElement(
                'button',
                { onClick: this.handleInvite.bind(this, false) },
                'Reject'
            )
        );
    }

});

var InviteBuddyMicro = React.createClass({

    getInitialState: function () {
        return { msg: typeof this.props.msg === 'undefined' ? 'Send Request' : this.props.msg };
    },
    handleInvite: function () {
        'use strict';

        var buddy = this.props.buddy;
        $.ajax({
            url: '/api/v1/invites/',
            method: 'POST',
            data: {
                buddyId: buddy._id,
                _csrf: APP._csrf
            }
        }).success(function (response) {
            events.publish('admin/alert', { className: 'text-success', msg: 'Buddy request was sent' });
        }).fail(function (response) {
            events.publish('admin/alert', { className: 'text-danger', msg: 'There was a problem sending request. Please try again.' });
        });
    },
    render: function () {
        return React.createElement(
            'button',
            { onClick: this.handleInvite.bind(this) },
            this.state.msg
        );
    }

});

var MessageMicro = React.createClass({
    getInitialState: function () {
        return {
            msg: '',
            messagePresent: false,
            defaultClass: 'text-danger',
            className: 'text-danger'
        };
    },
    clearMessage: function () {
        var self = this;
        setTimeout(function () {
            self.setState({
                msg: '',
                messagePresent: false,
                className: self.state.defaultClass
            });
        }, 30000);
    },
    componentDidMount: function () {
        var self = this;
        events.subscribe('admin/alert', function (details) {
            console.log(details.className);
            self.setState({
                msg: details.msg,
                messagePresent: true,
                className: typeof details.className !== 'undefined' ? details.className : self.state.defaultClass
            });

            self.clearMessage();
        });
    },
    render: function () {

        return React.createElement(
            'messageWrapper',
            null,
            this.state.messagePresent ? React.createElement(
                'message',
                { className: this.state.className },
                this.state.msg
            ) : React.createElement('message', null)
        );
    }

});

var AppRouter = Backbone.Router.extend({
    routes: {
        "invite": "invite",
        "find": "find",
        "buddies": "buddies",
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
    InviteController();
});

app_router.on('route:buddies', function(actions) {
    AllBuddiesController();
});

app_router.on('route:defaultRoute', function(actions) {
    PendingInvitesController();
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
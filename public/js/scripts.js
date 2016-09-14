// buddies
var Buddies = Backbone.Model.extend({
    urlRoot: '/api/v1/buddies',
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
// start of buddies
var AllBuddiesController = function(){

    var buddiesList = new Buddies(); // models/buddies.js

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
    ReactDOM.render(React.createElement(FindBuddiesR, null), document.getElementById(window.APP.mounts.buddiesMount));

};
// start of buddies
var InviteController = function(){

    ReactDOM.render(
        React.createElement(InviteBuddiesR, null),
        document.getElementById(window.APP.mounts.buddiesMount) //
    );

};
var AuthNav = React.createClass({
    updateController: function (controller) {
        window.location.hash = controller;
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "buddies") },
                "All"
            ),
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "invite") },
                "Invite"
            ),
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "find") },
                "Find"
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
            'section',
            null,
            React.createElement('input', { type: 'text', placeholder: 'Type here', onChange: this.handleTextChange }),
            React.createElement(
                'button',
                { onClick: this.findBuddies.bind(this) },
                'Find'
            ),
            React.createElement(AuthBuddies, { buddies: self.state.buddies })
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
            null,
            React.createElement('input', { type: 'text', placeholder: 'Email address', onChange: this.handleTextChange }),
            React.createElement(
                'button',
                { onClick: this.sendInvite.bind(this) },
                'Send invite'
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
        $.get('/api/v1/invite/' + buddy._id, function (response) {}).done(function (response) {
            // Always when complete
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
        }, 10000);
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

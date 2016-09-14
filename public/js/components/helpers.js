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
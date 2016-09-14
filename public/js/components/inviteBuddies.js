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
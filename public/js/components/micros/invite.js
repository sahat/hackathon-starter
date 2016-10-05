
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
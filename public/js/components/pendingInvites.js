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
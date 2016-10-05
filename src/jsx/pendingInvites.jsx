var PendingInvitesR = React.createClass({
    getInitialState: function() {
        return {
            invites: this.props.upcoming,
            pendingBuddyRequests: this.props.pendingBuddyRequests
        };
    },
    componentDidMount: function(){

        var self = this;

        events.subscribe('buddies/pendingRequests', function(pendingRequests){
            self.setState({pendingBuddyRequests: pendingRequests});
        });

        events.subscribe('buddies/upcomingInvites', function(upcomingInvites){
            self.setState({invites: upcomingInvites});
        });

    },
    render: function(){
        console.log(this)
        return (
            <div>
                <h2>Upcoming Sessions</h2>

                <h2>Pending Invites</h2>
                {(this.state.pendingBuddyRequests.map(function (buddy, index) {
                    return (
                       <ApproveBuddyMicro key={index} buddy={buddy}/>
                    )})
                )}
            </div>
        );
    }
});

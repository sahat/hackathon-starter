
var ApproveBuddyMicro = React.createClass({

    getInitialState: function() {
        return { buddy: this.props.buddy };
    },
    handleInvite: function(approvedStatus){
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
        })
        .success(function(response){
            events.publish('admin/alert',{className:'text-success', msg: 'Buddy request was approved'});
        })
        .fail(function(response){
            events.publish('admin/alert',{className:'text-danger', msg:'There was a problem approving buddy invite. Please try again.'});
        });
    },
    render: function () {
        var buddy = this.state.buddy;
        return (
            <section>
                {buddy.profile.name}
                <button onClick={this.handleInvite.bind(this, true)}>Approve</button>
                <button onClick={this.handleInvite.bind(this, false)}>Reject</button>
            </section>
        );
    }

});
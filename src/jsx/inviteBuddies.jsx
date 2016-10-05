var InviteBuddiesR = React.createClass({
    getInitialState: function() {
        return { buddyDetail: '' };
    },
    handleTextChange: function(event){
        this.setState({buddyDetail: event.target.value});
    },
    sendInvite: function(){

        var self = this;

        $.ajax({
            url: '/api/v1/buddies/invite',
            data: { buddyEmail: self.state.buddyDetail }
        })
        .done(function(response){
            events.publish('admin/alert',{className:'text-success', msg: JSON.stringify(response)});
        })
        .fail(function(response){
            events.publish('admin/alert',{className:'text-danger', msg: JSON.stringify(response)});
        });

    },
    render: function(){
        var self = this; // eww gross; never again. Must use es6.
        return (
            <inviteForm className="form-group">
                <h2>Invite a buddy to join</h2>
                <input className="form-control" type="text" placeholder="Email address" onChange={this.handleTextChange}/>
                <button className="form-control" onClick={this.sendInvite.bind(this)}>Send invite</button>
            </inviteForm>
        );
    }
});

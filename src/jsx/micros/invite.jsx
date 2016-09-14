
var InviteBuddyMicro = React.createClass({

    getInitialState: function() {
        return { msg: ( typeof this.props.msg === 'undefined' ) ? 'Send Request' : this.props.msg };
    },
    handleInvite: function(){
        'use strict';
        var buddy = this.props.buddy;
        $.get('/api/v1/invite/'+buddy._id, function(response){

        })
        .done(function(response){
           // Always when complete
        })
        .success(function(response){
            events.publish('admin/alert',{className:'text-success', msg: 'Buddy request was sent'});
        })
        .fail(function(response){
            events.publish('admin/alert',{className:'text-danger', msg:'There was a problem sending request. Please try again.'});
        });
    },
    render: function () {
        return (
            <button onClick={this.handleInvite.bind(this)}>{this.state.msg}</button>
        );
    }

});
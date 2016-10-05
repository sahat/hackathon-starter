var AuthNav = React.createClass({
    updateController: function(controller){
        console.log(this)
        window.location.hash = controller;
    },
    render: function(){
        return (
            <div>
                <button className="btn btn-default" onClick={this.updateController.bind(this, "invites")}>Pending</button>
                <button className="btn btn-default" onClick={this.updateController.bind(this, "buddies")}>My Buddies</button>
                <button className="btn btn-default" onClick={this.updateController.bind(this, "invite")}>Invite</button>
                <button className="btn btn-default" onClick={this.updateController.bind(this, "find")}>Find a Buddy</button>
            </div>
        );
    }
});

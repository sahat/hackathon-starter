var AuthNav = React.createClass({
    updateController: function(controller){
        window.location.hash = controller;
    },
    render: function(){
        return (
            <div>
                <button onClick={this.updateController.bind(this, "buddies")}>All</button>
                <button onClick={this.updateController.bind(this, "invite")}>Invite</button>
                <button onClick={this.updateController.bind(this, "find")}>Find</button>
            </div>
        );
    }
});

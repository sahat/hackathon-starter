var FindBuddiesR = React.createClass({
    getInitialState: function() {
        return { buddies: {} };
    },
    findBuddies: function(){
        var self = this;
        $.get('/api/v1/buddies/find/'+this.state.buddyDetail, function(response){
            self.setState({
                buddies: response.buddies
            });
            events.publish('findBuddies/result', { buddies: self.state.buddies, requestType: 'find' });
        });
    },
    handleTextChange: function(event){
        this.setState({buddyDetail: event.target.value});
    },
    render: function(){
        var self = this; // eww gross; never again. Must use es6.
        return (
            <div>
                <h2>Connect with a Buddy</h2>
                <section className="form-group">
                    <input className="form-control" type="text" placeholder="Type here" onChange={this.handleTextChange}/>
                    <button className="form-control" onClick={this.findBuddies.bind(this)}>Find</button>
                    <AuthBuddies buddies={self.state.buddies} />
                </section>
            </div>
        );
    }
});

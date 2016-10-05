var AuthBuddies = React.createClass({
    getInitialState: function() {
        return {
            buddies: this.props.buddies,
            buddiesPresent: (this.props.buddies.length > 0) ? true : false,
            inviteTemplate: (typeof this.props.requestType !== 'undefined' && this.props.requestType === 'find')
                ? true
                : false
        };
    },
    componentDidMount: function(){
        var self = this;
        events.subscribe('findBuddies/result', function(buddiesList){
            self.setState({
                buddies: buddiesList.buddies,
                buddiesPresent: (buddiesList.buddies.length > 0) ? true : false,
                inviteTemplate: (buddiesList.requestType === 'find') ? true : false
            });
        });
    },
    handleBuddiesChange: function(){
        return { buddies: this.props.buddies };
    },
    render: function(){
        var self = this;
        return (
            <div className="buddies-main">
                {(self.state.inviteTemplate
                    ? <h2></h2>
                    : <h2>Your Buddies</h2>
                )}

                {(this.state.buddiesPresent
                    ? this.state.buddies.map(function (buddy, index) {
                        return (
                            <div className="BuddiesWrapper">
                                {(self.state.inviteTemplate
                                    ? <BuddyInvite key={index} buddy={buddy}/>
                                    : <BuddyRow key={index} buddy={buddy}/>
                                )}
                            </div>
                        )
                    })
                    : <div className="no-buddies"></div>
                )}
            </div>
        );
    }
});

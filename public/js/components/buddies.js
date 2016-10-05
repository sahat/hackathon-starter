var AuthBuddies = React.createClass({
    getInitialState: function () {
        return {
            buddies: this.props.buddies,
            buddiesPresent: this.props.buddies.length > 0 ? true : false,
            inviteTemplate: typeof this.props.requestType !== 'undefined' && this.props.requestType === 'find' ? true : false
        };
    },
    componentDidMount: function () {
        var self = this;
        events.subscribe('findBuddies/result', function (buddiesList) {
            self.setState({
                buddies: buddiesList.buddies,
                buddiesPresent: buddiesList.buddies.length > 0 ? true : false,
                inviteTemplate: buddiesList.requestType === 'find' ? true : false
            });
        });
    },
    handleBuddiesChange: function () {
        return { buddies: this.props.buddies };
    },
    render: function () {
        var self = this;
        return React.createElement(
            'div',
            { className: 'buddies-main' },
            self.state.inviteTemplate ? React.createElement('h2', null) : React.createElement(
                'h2',
                null,
                'Your Buddies'
            ),
            this.state.buddiesPresent ? this.state.buddies.map(function (buddy, index) {
                return React.createElement(
                    'div',
                    { className: 'BuddiesWrapper' },
                    self.state.inviteTemplate ? React.createElement(BuddyInvite, { key: index, buddy: buddy }) : React.createElement(BuddyRow, { key: index, buddy: buddy })
                );
            }) : React.createElement('div', { className: 'no-buddies' })
        );
    }
});
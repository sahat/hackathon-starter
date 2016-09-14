var FindBuddiesR = React.createClass({
    getInitialState: function () {
        return { buddies: {} };
    },
    findBuddies: function () {
        var self = this;
        $.get('/api/v1/buddies/find/' + this.state.buddyDetail, function (response) {
            self.setState({
                buddies: response.buddies
            });
            events.publish('findBuddies/result', { buddies: self.state.buddies, requestType: 'find' });
        });
    },
    handleTextChange: function (event) {
        this.setState({ buddyDetail: event.target.value });
    },
    render: function () {
        var self = this; // eww gross; never again. Must use es6.
        return React.createElement(
            'section',
            null,
            React.createElement('input', { type: 'text', placeholder: 'Type here', onChange: this.handleTextChange }),
            React.createElement(
                'button',
                { onClick: this.findBuddies.bind(this) },
                'Find'
            ),
            React.createElement(AuthBuddies, { buddies: self.state.buddies })
        );
    }
});
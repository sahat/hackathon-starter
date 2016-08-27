var AuthBuddies = React.createClass({

    render: function () {
        window.buddies = this.props.buddies;

        return React.createElement(
            "div",
            null,
            "for(var index in this.props.buddies)",
            React.createElement(
                "section",
                null,
                buddies[index].email,
                " | ",
                buddies[index].status
            ),
            "Buddies!"
        );
    }
});
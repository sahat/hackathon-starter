var AuthNav = React.createClass({
    updateController: function (controller) {
        window.location.hash = controller;
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "buddies") },
                "All"
            ),
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "invite") },
                "Invite"
            ),
            React.createElement(
                "button",
                { onClick: this.updateController.bind(this, "find") },
                "Find"
            )
        );
    }
});
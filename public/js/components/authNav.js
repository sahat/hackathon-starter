var AuthNav = React.createClass({
    updateController: function (controller) {
        console.log(this);
        window.location.hash = controller;
    },
    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "invites") },
                "Pending"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "buddies") },
                "My Buddies"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "invite") },
                "Invite"
            ),
            React.createElement(
                "button",
                { className: "btn btn-default", onClick: this.updateController.bind(this, "find") },
                "Find a Buddy"
            )
        );
    }
});
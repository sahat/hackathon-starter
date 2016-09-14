var BuddyRow = React.createClass({
    render: function () {
        return (
            <section className="buddy">
                {this.props.buddy.email} | {this.props.buddy.status} <InviteBuddyMicro buddy={this.props.buddy}/>
            </section>
        );
    }
});
var BuddyInvite = React.createClass({
    render: function () {
        return (
            <section className="buddy">
                {this.props.buddy.email} <InviteBuddyMicro buddy={this.props.buddy} msg="Connect"/>
            </section>
        );
    }
});
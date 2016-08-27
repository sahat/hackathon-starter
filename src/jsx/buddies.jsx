var AuthBuddies = React.createClass({

    render: function(){
        window.buddies = this.props.buddies

        return (
            <div>
                for(var index in this.props.buddies){
                    <section>
                        {buddies[index].email} | {buddies[index].status}
                    </section>
                }
                Buddies!

            </div>
        );
    }
});

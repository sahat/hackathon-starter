
var MessageMicro = React.createClass({
    getInitialState: function() {
        return {
            msg: '',
            messagePresent: false,
            defaultClass: 'text-danger',
            className: 'text-danger'
        };
    },
    clearMessage: function(){
        var self = this;
        setTimeout(function(){
            self.setState({
                msg: '',
                messagePresent: false,
                className: self.state.defaultClass
            });
        }, 30000);
    },
    componentDidMount: function(){
        var self = this;
        events.subscribe('admin/alert', function(details){
            console.log(details.className);
            self.setState({
                msg: details.msg,
                messagePresent: true,
                className: (typeof details.className !== 'undefined')
                    ? details.className
                    : self.state.defaultClass
            });

            self.clearMessage();

        });
    },
    render: function () {

        return (
            <messageWrapper>
                {(this.state.messagePresent
                    ? <message className={this.state.className}>{this.state.msg}</message>
                    : <message></message>
                )}
            </messageWrapper>
        );
    }

});
// start of buddies
var buddiesController = function(){

    var buddiesList = new Buddies(); // models/buddies.js

    buddiesList
        .fetch()
        .done(function(){
            ReactDOM.render(
                React.createElement(AuthBuddies, { buddies: buddiesList.attributes }),
                window.APP.buddiesMount[0] //
            );
        });

};
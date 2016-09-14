// start of buddies
var AllBuddiesController = function(){

    var buddiesList = new Buddies(); // models/buddies.js

    buddiesList
        .fetch()
        .done(function(buddies){
            ReactDOM.render(
                React.createElement(AuthBuddies, { buddies: buddiesList.toJSON().buddies }),
                document.getElementById(window.APP.mounts.buddiesMount) //
            );
        });

};
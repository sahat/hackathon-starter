var chai = require('chai');
var should = chai.should();
var EventController = require('../controllers/event');

describe('Event Controller', function() {
    it('should create a controller', function(done) {
        var econtroller = EventController;
        (econtroller).should.not.equal(null);
    });
});

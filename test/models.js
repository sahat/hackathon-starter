const chai = require('chai');
const sinon = require('sinon')
const mongoose =  require('mongoose');
const expect = chai.expect;
const User = require('../models/User');
require('sinon-mongoose');

describe('User Model', () => {

    it('should create a new user', (done) => {
        const UserMock = sinon.mock(new User({email: 'test@gmail.com', password: 'password'}));
        const user = UserMock.object;
        const expectedResult = {
            status: true
        };
        UserMock
            .expects('save')
            .yields(null, expectedResult);
        user.save(function (err, result) {
            UserMock.verify();
            UserMock.restore();
            expect(result.status).to.be.true;
            done();
        });
    })

    it('should return error if user is not created', (done) => {
        const UserMock = sinon.mock(new User({email: 'test@gmail.com', password: 'password'}));
        const user = UserMock.object;
        const expectedResult = {
            status: false
        };

        UserMock
            .expects('save')
            .yields(expectedResult, null);
        user.save(function (err, result) {
            UserMock.verify();
            UserMock.restore();
            expect(err.status).to.be.false;
            expect(result).to.be.null;
            done();
        });
    })

    it('should not create a user with the unique email', (done) => {
        const UserMock = sinon.mock(User({email: 'test@gmail.com', password: 'password'}));
        const user = UserMock.object;
        const expectedResult = {
            status: false
        };

        UserMock
            .expects('save')
            .yields(expectedResult, null);
        user.save(function (err, result) {
            UserMock.verify();
            UserMock.restore();
            expect(err.status).to.be.false;
            done();
        });
    })

    it('should find user by email', (done) => {
        const userMock = sinon.mock(User)
        const expectedUser = {
            status: true,
            user: {}
        };

        userMock
            .expects('findOne')
            .withArgs({email: 'test@gmail.com'})
            .yields(null, expectedUser)
        User.findOne({
            email: 'test@gmail.com'
        }, (err, result) => {
            userMock.verify();
            userMock.restore();
            expect(result.status).to.be.true;
            done();
        })
    });

    it('should delete user by email', (done) => {
        const userMock = sinon.mock(User)
        const expectedResult = {
            status: true
        };

        userMock
            .expects('remove')
            .withArgs({email: 'test@gmail.com'})
            .yields(null, expectedResult)
        User.remove({
            email: 'test@gmail.com'
        }, (err, result) => {
            userMock.verify();
            userMock.restore();
            expect(result.status).to.be.true;
            done();
        })
    });
});

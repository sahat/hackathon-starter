const { expect } = require('chai');
const sinon = require('sinon');
const { flash } = require('../config/flash');

describe('flash middleware core tests', () => {
  let req, res, next;
  beforeEach(() => {
    req = { session: {} };
    res = {
      locals: {},
      render: sinon.spy(),
    };
    next = sinon.spy();
  });

  it('should store a single flash message', () => {
    flash(req, res, next);
    req.flash('info', 'hello');
    expect(req.session.flash.info).to.deep.equal(['hello']);
  });

  it('should accumulate multiple flash messages of same type', () => {
    flash(req, res, next);
    req.flash('info', 'first');
    req.flash('info', 'second');
    expect(req.session.flash.info).to.deep.equal(['first', 'second']);
  });

  it('should store multiple messages passed as array', () => {
    flash(req, res, next);
    req.flash('warning', ['msg1', 'msg2']);
    expect(req.session.flash.warning).to.deep.equal(['msg1', 'msg2']);
  });

  it('should store messages of different types separately', () => {
    flash(req, res, next);
    req.flash('info', 'info1');
    req.flash('error', 'error1');
    expect(req.session.flash.info).to.deep.equal(['info1']);
    expect(req.session.flash.error).to.deep.equal(['error1']);
  });

  it('should retrieve and clear messages of a type', () => {
    flash(req, res, next);
    req.flash('info', 'hello');
    const msgs = req.flash('info');
    expect(msgs).to.deep.equal(['hello']);
    expect(req.session.flash.info).to.be.undefined;
  });

  it('should retrieve all messages grouped by type', () => {
    flash(req, res, next);
    req.flash('info', 'i1');
    req.flash('error', 'e1');
    const all = req.flash();
    expect(all).to.deep.equal({ info: ['i1'], error: ['e1'] });
    expect(req.session.flash).to.deep.equal({});
  });

  it('should return empty array for unknown type', () => {
    flash(req, res, next);
    const msgs = req.flash('unknown');
    expect(msgs).to.deep.equal([]);
  });

  it('should attach messages to res.locals on render', () => {
    flash(req, res, next);
    req.flash('info', 'hello');
    res.render('index');
    expect(res.locals.messages).to.deep.equal({ info: [{ msg: 'hello' }] });
    // calling again clears messages
    res.render('index');
    expect(res.locals.messages).to.deep.equal({});
  });
});

describe('flash middleware integration behavior', () => {
  let req, res, next;
  beforeEach(() => {
    req = { session: {} };
    res = {
      locals: {},
      render: sinon.spy(),
    };
    next = sinon.spy();
  });

  it('should consume messages after read', () => {
    flash(req, res, next);
    req.flash('info', 'Hello'); // set a message
    // First read
    let messages = req.flash('info');
    expect(messages).to.deep.equal(['Hello']);
    // Second read should be empty
    messages = req.flash('info');
    expect(messages).to.deep.equal([]);
  });

  it('should expose messages to res.locals.messages for views', () => {
    flash(req, res, next);
    req.flash('info', 'Hello');
    res.render('index');
    expect(res.locals.messages).to.deep.equal({ info: [{ msg: 'Hello' }] });
    expect(req.session.flash).to.deep.equal({});
  });

  it('should have no messages by default', () => {
    flash(req, res, next);
    res.render('index');
    expect(res.locals.messages).to.deep.equal({});
  });

  it('should isolate messages between sessions', () => {
    const session1 = { flash: {} };
    const session2 = { flash: {} };

    const req1 = { session: session1 };
    const res1 = { locals: {}, render: sinon.spy() };

    const req2 = { session: session2 };
    const res2 = { locals: {}, render: sinon.spy() };

    flash(req1, res1, next);
    flash(req2, res2, next);

    req1.flash('info', 'Message for session1');
    req2.flash('info', 'Message for session2');

    // Each session sees only its own messages
    expect(req1.flash('info')).to.deep.equal(['Message for session1']);
    expect(req2.flash('info')).to.deep.equal(['Message for session2']);
  });
});

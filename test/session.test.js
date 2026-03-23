const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const Session = require('../models/Session');

describe('Session Model', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('treats invalid userId as a no-op', async () => {
    const deleteManySpy = sinon.stub(Session, 'deleteMany').rejects(new Error('should not be called'));

    const result = await Session.removeSessionByUserId('not-a-mongo-id');
    expect(result).to.have.property('deletedCount', 0);
    expect(deleteManySpy.called).to.equal(false);
  });

  it('builds a regex that matches the exact quoted ObjectId string', async () => {
    const idA = new mongoose.Types.ObjectId().toString();

    const deleteManyStub = sinon.stub(Session, 'deleteMany').callsFake(async (filter) => ({
      acknowledged: true,
      deletedCount: 123,
      filter,
    }));

    const result = await Session.removeSessionByUserId(idA);

    expect(result).to.have.property('deletedCount', 123);
    expect(deleteManyStub.calledOnce).to.equal(true);

    const [filter] = deleteManyStub.firstCall.args;
    expect(filter).to.have.property('expires');
    expect(filter).to.have.property('session');

    const regex = filter.session.$regex;
    expect(regex).to.be.instanceOf(RegExp);

    // Matches exact quoted value.
    expect(regex.test(`{"passport":{"user":"${idA}"}}`)).to.equal(true);

    // Does NOT match when the quoted id is not exact.
    expect(regex.test(`{"passport":{"user":"${idA}X"}}`)).to.equal(false);
  });
});

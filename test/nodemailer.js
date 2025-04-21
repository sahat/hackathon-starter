const { expect } = require('chai');
const sinon = require('sinon');
const nodemailer = require('nodemailer');

describe('Nodemailer Config', () => {
  let transporterStub;
  let createTransportStub;
  let flashStub;
  let req;

  beforeEach(() => {
    sinon.restore();
    flashStub = sinon.stub();
    req = { flash: flashStub };
    transporterStub = {
      sendMail: sinon.stub(),
    };
    createTransportStub = sinon.stub(nodemailer, 'createTransport');
    createTransportStub.returns(transporterStub);
    delete require.cache[require.resolve('../config/nodemailer')];
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send mail successfully on first try', async () => {
    // eslint-disable-next-line global-require
    const nodemailerConfig = require('../config/nodemailer');
    transporterStub.sendMail.resolves({ messageId: 'test-id' });

    const settings = {
      mailOptions: {
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test Email',
        text: 'Test content',
      },
      req,
      successfulType: 'success',
      successfulMsg: 'Email sent successfully',
      errorType: 'errors',
      errorMsg: 'Failed to send email',
    };

    await nodemailerConfig.sendMail(settings);

    expect(transporterStub.sendMail.calledOnce).to.be.true;
    expect(flashStub.calledOnce).to.be.true;
    expect(flashStub.firstCall.args[0]).to.equal('success');
    expect(flashStub.firstCall.args[1]).to.deep.equal({ msg: 'Email sent successfully' });
  });

  it('should retry with lowered security after self-signed certificate error', async () => {
    // eslint-disable-next-line global-require
    const nodemailerConfig = require('../config/nodemailer');
    transporterStub.sendMail.onFirstCall().rejects(new Error('self signed certificate in certificate chain')).onSecondCall().resolves({ messageId: 'test-id' });

    const settings = {
      mailOptions: {
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test Email',
        text: 'Test content',
      },
      req,
      successfulType: 'success',
      successfulMsg: 'Email sent successfully',
      errorType: 'errors',
      errorMsg: 'Failed to send email',
    };

    await nodemailerConfig.sendMail(settings);

    expect(transporterStub.sendMail.calledTwice).to.be.true;
    expect(flashStub.calledOnce).to.be.true;
    expect(flashStub.firstCall.args[0]).to.equal('success');
    expect(flashStub.firstCall.args[1]).to.deep.equal({ msg: 'Email sent successfully' });
  });

  it('should handle general error', async () => {
    // eslint-disable-next-line global-require
    const nodemailerConfig = require('../config/nodemailer');
    transporterStub.sendMail.rejects(new Error('General error'));

    const settings = {
      mailOptions: {
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test Email',
        text: 'Test content',
      },
      req,
      successfulType: 'success',
      successfulMsg: 'Email sent successfully',
      errorType: 'errors',
      errorMsg: 'Failed to send email',
    };

    const result = await nodemailerConfig.sendMail(settings);

    expect(transporterStub.sendMail.calledOnce).to.be.true;
    expect(flashStub.calledOnce).to.be.true;
    expect(flashStub.firstCall.args[0]).to.equal('errors');
    expect(flashStub.firstCall.args[1]).to.deep.equal({ msg: 'Failed to send email' });
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal('General error');
  });

  it('should handle retry failure after self-signed certificate error', async () => {
    // eslint-disable-next-line global-require
    const nodemailerConfig = require('../config/nodemailer');
    transporterStub.sendMail.onFirstCall().rejects(new Error('self signed certificate in certificate chain')).onSecondCall().rejects(new Error('Retry failed'));

    const settings = {
      mailOptions: {
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test Email',
        text: 'Test content',
      },
      req,
      successfulType: 'success',
      successfulMsg: 'Email sent successfully',
      errorType: 'errors',
      errorMsg: 'Failed to send email',
    };

    const result = await nodemailerConfig.sendMail(settings);

    expect(transporterStub.sendMail.calledTwice).to.be.true;
    expect(flashStub.calledOnce).to.be.true;
    expect(flashStub.firstCall.args[0]).to.equal('errors');
    expect(flashStub.firstCall.args[1]).to.deep.equal({ msg: 'Failed to send email' });
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal('Retry failed');
  });
});

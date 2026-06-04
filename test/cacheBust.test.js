const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('node:fs');
const path = require('node:path');

const { getFileHash, clearCache } = require('../config/cacheBust');

describe('getFileHash', () => {
  let readFileStub;
  const rootDir = '/project';
  const libFiles = new Map([['/js/lib/jquery.min.js', 'node_modules/jquery/dist/jquery.min.js']]);

  beforeEach(() => {
    clearCache();
    readFileStub = sinon.stub(fs, 'readFileSync');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns an 8-character hex string', () => {
    readFileStub.returns(Buffer.from('hello'));
    const hash = getFileHash('/css/main.css', new Map(), rootDir);
    expect(hash).to.match(/^[0-9a-f]{8}$/);
  });

  it('returns the same hash for the same file on repeated calls', () => {
    readFileStub.returns(Buffer.from('hello'));
    const first = getFileHash('/css/main.css', new Map(), rootDir);
    const second = getFileHash('/css/main.css', new Map(), rootDir);
    expect(first).to.equal(second);
  });

  it('reads the file from disk only once for repeated calls (caching)', () => {
    readFileStub.returns(Buffer.from('hello'));
    getFileHash('/css/main.css', new Map(), rootDir);
    getFileHash('/css/main.css', new Map(), rootDir);
    getFileHash('/css/main.css', new Map(), rootDir);
    expect(readFileStub.calledOnce).to.equal(true);
  });

  it('returns different hashes for different file contents', () => {
    readFileStub.onFirstCall().returns(Buffer.from('hello'));
    readFileStub.onSecondCall().returns(Buffer.from('world'));
    const hashA = getFileHash('/css/a.css', new Map(), rootDir);
    const hashB = getFileHash('/css/b.css', new Map(), rootDir);
    expect(hashA).to.not.equal(hashB);
  });

  it('resolves non-libFiles URLs as a path under public/', () => {
    readFileStub.returns(Buffer.from('hello'));
    getFileHash('/css/main.css', new Map(), rootDir);
    expect(readFileStub.firstCall.args[0]).to.equal(path.join(rootDir, 'public', 'css', 'main.css'));
  });

  it('resolves libFiles URLs using the libFiles value as the path', () => {
    readFileStub.returns(Buffer.from('hello'));
    getFileHash('/js/lib/jquery.min.js', libFiles, rootDir);
    expect(readFileStub.firstCall.args[0]).to.equal(path.join(rootDir, 'node_modules/jquery/dist/jquery.min.js'));
  });

  it('throws when the file read fails', () => {
    readFileStub.throws(new Error('disk failure'));
    expect(() => getFileHash('/css/missing.css', new Map(), rootDir)).to.throw('disk failure');
  });
});

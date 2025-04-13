const morgan = require('morgan');
const { expect } = require('chai');
const sinon = require('sinon');

// Import the morgan configuration to ensure tokens are registered
require('../config/morgan');

describe('Morgan Configuration Tests', () => {
  let req;
  let res;
  let clock;

  beforeEach(() => {
    // Mock request
    req = {
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'remote-addr': '127.0.0.1',
      },
      ip: '127.0.0.1',
    };

    // Mock response
    res = {
      statusCode: 200,
      getHeader: sinon.stub(),
      _header: {}, // morgan checks for this
    };

    // Fix the date for consistent testing
    clock = sinon.useFakeTimers(new Date('2024-01-01T12:00:00').getTime());
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('Custom Token: colored-status', () => {
    it('should color status codes correctly', () => {
      const testCases = [
        { status: 200, color: '\x1b[32m' }, // green
        { status: 304, color: '\x1b[36m' }, // cyan
        { status: 404, color: '\x1b[33m' }, // yellow
        { status: 500, color: '\x1b[31m' }, // red
      ];

      testCases.forEach(({ status, color }) => {
        res.statusCode = status;
        const formatter = morgan.compile(':colored-status');
        const output = formatter(morgan, req, res);
        expect(output).to.equal(`${color}${status}\x1b[0m`);
      });
    });
  });

  describe('Custom Token: short-date', () => {
    it('should format date correctly', () => {
      const formatter = morgan.compile(':short-date');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('2024-01-01 12:00:00');
    });
  });

  describe('Custom Token: parsed-user-agent', () => {
    it('should parse user agent correctly', () => {
      const formatter = morgan.compile(':parsed-user-agent');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('Windows/Chrome v120');
    });

    it('should handle unknown user agent', () => {
      req.headers['user-agent'] = undefined;
      const formatter = morgan.compile(':parsed-user-agent');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('Unknown');
    });
  });

  describe('Custom Token: content-length-in-kb', () => {
    it('should format content length to KB', () => {
      res.getHeader.withArgs('Content-Length').returns(2048);
      const formatter = morgan.compile(':content-length-in-kb');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('2.00KB');
    });

    it('should handle missing content length', () => {
      res.getHeader.withArgs('Content-Length').returns(undefined);
      const formatter = morgan.compile(':content-length-in-kb');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('-');
    });
  });

  describe('Complete Morgan Format', () => {
    it('should combine all tokens correctly', () => {
      // Setup response with known values
      res.statusCode = 200;
      res.getHeader.withArgs('Content-Length').returns(2048);

      // Get the complete format string from your configuration
      const formatter = morgan.compile(':short-date :method :url :colored-status :response-time[0]ms :content-length-in-kb :remote-addr :parsed-user-agent');

      const output = formatter(morgan, req, res);

      // Test the complete output contains all expected parts
      expect(output).to.include('2024-01-01 12:00:00'); // date
      expect(output).to.include('GET'); // method
      expect(output).to.include('/test'); // url
      expect(output).to.include('\x1b[32m200\x1b[0m'); // colored status
      expect(output).to.include('2.00KB'); // content length
      expect(output).to.include('127.0.0.1'); // remote addr
      expect(output).to.include('Windows/Chrome v120'); // parsed user agent
    });
  });
});

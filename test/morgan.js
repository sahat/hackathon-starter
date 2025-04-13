const morgan = require('morgan');
const { expect } = require('chai');
const sinon = require('sinon');

// Import the morgan configuration to ensure tokens are registered
require('../config/morgan');

describe('Morgan Configuration Tests', () => {
  let req;
  let res;
  let clock;
  const originalEnv = process.env.NODE_ENV;

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

    // Enhanced mock response
    res = {
      statusCode: 200,
      _header: true, // Set to true to indicate headers sent
      finished: true, // Set to true to indicate response complete
      _headers: {}, // for storing headers
      getHeader(name) {
        return this._headers[name.toLowerCase()];
      },
      get(name) {
        return this.getHeader(name);
      },
      setHeader(name, value) {
        this._headers[name.toLowerCase()] = value;
      },
    };

    // Fix the date for consistent testing
    clock = sinon.useFakeTimers(new Date('2024-01-01T12:00:00').getTime());
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
    process.env.NODE_ENV = originalEnv;
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

  describe('Custom Token: bytes-sent', () => {
    it('should format bytes correctly', () => {
      res.setHeader('Content-Length', '2048');
      const formatter = morgan.compile(':bytes-sent');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('2.00KB');
    });

    it('should handle missing content length', () => {
      const formatter = morgan.compile(':bytes-sent');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('-');
    });
  });

  describe('Custom Token: transfer-state', () => {
    it('should show correct transfer state', () => {
      const formatter = morgan.compile(':transfer-state');
      const output = formatter(morgan, req, res);
      expect(output).to.equal('COMPLETE');
    });
  });

  describe('Complete Morgan Format', () => {
    it('should combine all tokens correctly in development', () => {
      process.env.NODE_ENV = 'development';
      // Setup response with known values
      res.statusCode = 200;
      res.setHeader('Content-Length', '2048');

      const formatter = morgan.compile(':short-date :method :url :colored-status :response-time[0]ms :bytes-sent :transfer-state :remote-addr :parsed-user-agent');

      const output = formatter(morgan, req, res);

      // Test the complete output contains all expected parts
      expect(output).to.include('2024-01-01 12:00:00'); // date
      expect(output).to.include('GET'); // method
      expect(output).to.include('/test'); // url
      expect(output).to.include('\x1b[32m200\x1b[0m'); // colored status
      expect(output).to.include('2.00KB'); // bytes sent
      expect(output).to.include('127.0.0.1'); // IP address in development
      expect(output).to.include('Windows/Chrome v120'); // parsed user agent
    });

    it('should redact IP address in production', () => {
      process.env.NODE_ENV = 'production';
      res.statusCode = 200;
      res.setHeader('Content-Length', '2048');

      const formatter = morgan.compile(':short-date :method :url :colored-status :response-time[0]ms :bytes-sent :transfer-state REDACTED :parsed-user-agent');

      const output = formatter(morgan, req, res);

      expect(output).to.include('REDACTED');
      expect(output).to.not.include('127.0.0.1');
      expect(output).to.include('2.00KB'); // bytes sent
    });
  });
});

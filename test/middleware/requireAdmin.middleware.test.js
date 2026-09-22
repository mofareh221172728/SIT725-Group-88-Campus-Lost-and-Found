'use strict';

const { expect } = require('chai');
const requireAdmin = require('../../middleware/requireAdmin.middleware');
const User = require('../../models/user.model');
const db = require('../helpers/db');

describe('requireAdmin Middleware', () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  function createRes() {
    return {
      statusCode: undefined,
      body: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
  }

  describe('[SECURITY] Session & Role Authorization', () => {
    it('TC-SEC-01: should return 403 for the seeded mock user (default role)', async () => {
      // no role is set, apply with schema default.
      const mockUser = await User.create({ email: 'mock.user@deakin.edu.au' });
      const req = { session: { userId: mockUser._id.toString() } };
      const res = createRes();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.deep.equal({ message: 'Admin access is required.' });
    });

    it('TC-SEC-02: should return 403 when the session has expired', async () => {
      // An expired session no longer carries a userId
      // requireAuth rejects with 401 first before reaching requireAdmin in admin routes.
      const req = { session: {} };
      const res = createRes();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.deep.equal({ message: 'Admin access is required.' });
    });

    it('TC-SEC-03: should call next() with no arguments when the session user is an admin', async () => {
      const admin = await User.create({
        email: 'admin.sec@deakin.edu.au',
        role: 'admin',
      });
      const req = { session: { userId: admin._id.toString() } };
      const res = createRes();
      let nextArgs;
      let nextCalled = false;

      await requireAdmin(req, res, (...args) => {
        nextCalled = true;
        nextArgs = args;
      });

      expect(nextCalled).to.be.true;
      expect(nextArgs).to.deep.equal([]);
      expect(res.statusCode).to.be.undefined;
    });
  });
});

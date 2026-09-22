'use strict';

const { expect } = require('chai');
const User = require('../../models/user.model');

describe('User Model Schema Validation', () => {
  const getValidationError = async (doc) => {
    try {
      await doc.validate();
      return undefined;
    } catch (err) {
      return err;
    }
  };

  describe('[POSITIVE] Valid Document Creation', () => {
    it('U-01: should pass validation with a valid email', async () => {
      const user = new User({ email: 'student@deakin.edu.au' });
      const err = await getValidationError(user);
      expect(err).to.be.undefined;
    });

    it('U-04: should default role to "user" when not provided', async () => {
      const user = new User({ email: 'student@deakin.edu.au' });
      const err = await getValidationError(user);
      expect(err).to.be.undefined;
      expect(user.role).to.equal('user');
    });

    it('U-05: should pass validation with role explicitly set to "admin"', async () => {
      const user = new User({ email: 'admin@deakin.edu.au', role: 'admin' });
      const err = await getValidationError(user);
      expect(err).to.be.undefined;
      expect(user.role).to.equal('admin');
    });
  });

  describe('[REQUIRED] Mandatory Field Validation', () => {
    it('U-02: should fail validation if email is missing', async () => {
      const user = new User({});
      const err = await getValidationError(user);
      expect(err).to.exist;
      expect(err.errors.email).to.exist;
    });
  });

  describe('[LENGTH / FORMAT] Normalization & Sanitization', () => {
    it('U-03: should normalize email to lowercase and trim leading/trailing whitespace', async () => {
      const user = new User({ email: '   TestUser@DEAKIN.EDU.AU   ' });
      const err = await getValidationError(user);
      expect(err).to.be.undefined;
      expect(user.email).to.equal('testuser@deakin.edu.au');
    });
  });

  describe('[TYPE & ENUM] Enumeration and Allowed Values', () => {
    it('U-06: should fail validation with a role outside the enum', async () => {
      const user = new User({ email: 'student@deakin.edu.au', role: 'superadmin' });
      const err = await getValidationError(user);
      expect(err).to.exist;
      expect(err.errors.role).to.exist;
    });
  });
});

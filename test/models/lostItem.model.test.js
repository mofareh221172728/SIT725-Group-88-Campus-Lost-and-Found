'use strict';

const { expect } = require('chai');
const mongoose = require('mongoose');
const LostItem = require('../../models/lostItem.model');

describe('LostItem Model Schema Validation', () => {
  const validOwnerId = new mongoose.Types.ObjectId();

  const getValidLostItemData = () => ({
    ownerId: validOwnerId,
    title: 'Black Leather Wallet',
    category: 'Wallets & Purses',
    description: 'Black leather bi-fold wallet lost near building LA cafeteria',
    lostAt: new Date('2026-09-02'),
    campusLocation: 'Burwood Campus, Building LA',
    status: 'active',
  });

  const getValidationError = async (doc) => {
    try {
      await doc.validate();
      return undefined;
    } catch (err) {
      return err;
    }
  };

  describe('[POSITIVE] Valid Document Creation', () => {
    it('LI-01: should pass validation with all valid required fields', async () => {
      const item = new LostItem(getValidLostItemData());
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('LI-02: should default status to "active"', async () => {
      const data = getValidLostItemData();
      delete data.status;
      const item = new LostItem(data);
      expect(item.status).to.equal('active');
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('LI-03: should accept "resolved" status', async () => {
      const data = { ...getValidLostItemData(), status: 'resolved' };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });
  });

  describe('[REQUIRED] Mandatory Field Validation', () => {
    it('LI-04: should fail validation if ownerId is missing', async () => {
      const data = getValidLostItemData();
      delete data.ownerId;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.ownerId).to.exist;
    });

    it('LI-05: should fail validation if title is missing', async () => {
      const data = getValidLostItemData();
      delete data.title;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.title).to.exist;
    });

    it('LI-06: should fail validation if category is missing', async () => {
      const data = getValidLostItemData();
      delete data.category;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.category).to.exist;
    });

    it('LI-07: should fail validation if description is missing', async () => {
      const data = getValidLostItemData();
      delete data.description;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.description).to.exist;
    });

    it('LI-08: should fail validation if campusLocation is missing', async () => {
      const data = getValidLostItemData();
      delete data.campusLocation;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.campusLocation).to.exist;
    });
  });

  describe('[TEMPORAL] Date Field Validation', () => {
    it('LI-09: should pass validation with a valid lostAt Date', async () => {
      const data = { ...getValidLostItemData(), lostAt: new Date('2026-08-20T12:00:00Z') };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('LI-10: should fail validation if lostAt date is missing', async () => {
      const data = getValidLostItemData();
      delete data.lostAt;
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.lostAt).to.exist;
    });
  });

  describe('[BOUNDARY] Photo Array Constraints (0-3 photos)', () => {
    it('LI-11: should pass boundary validation with 0 photos attached', async () => {
      const data = { ...getValidLostItemData(), photos: [] };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('LI-12: should pass boundary validation with exactly 3 photos attached', async () => {
      const data = {
        ...getValidLostItemData(),
        photos: [
          'https://example.com/wallet1.jpg',
          'https://example.com/wallet2.jpg',
          'https://example.com/wallet3.jpg',
        ],
      };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('LI-13: should fail boundary validation when more than 3 photos are attached (>3 limit)', async () => {
      const data = {
        ...getValidLostItemData(),
        photos: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
        ],
      };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.photos).to.exist;
      expect(err.errors.photos.message).to.equal(
        'A lost item report can contain up to three photos.'
      );
    });
  });

  describe('[TYPE & ENUM] Enumeration and Allowed Values', () => {
    it('LI-14: should reject invalid status enum values', async () => {
      const data = { ...getValidLostItemData(), status: 'closed' };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.status).to.exist;
    });
  });

  describe('[LENGTH / FORMAT] String Sanitization & Trimming', () => {
    it('LI-15: should trim leading and trailing whitespace from string fields', async () => {
      const data = {
        ...getValidLostItemData(),
        title: '   Trimmed Wallet   ',
        category: '  Bags  ',
        description: '  Description padding  ',
        campusLocation: '  Building LA  ',
      };
      const item = new LostItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
      expect(item.title).to.equal('Trimmed Wallet');
      expect(item.category).to.equal('Bags');
      expect(item.description).to.equal('Description padding');
      expect(item.campusLocation).to.equal('Building LA');
    });
  });
});

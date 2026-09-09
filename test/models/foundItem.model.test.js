'use strict';

const { expect } = require('chai');
const mongoose = require('mongoose');
const FoundItem = require('../../models/foundItem.model');

describe('FoundItem Model Schema Validation', () => {
  const validOwnerId = new mongoose.Types.ObjectId();

  const getValidFoundItemData = () => ({
    ownerId: validOwnerId,
    title: 'Blue Water Bottle',
    category: 'Bottles & Containers',
    description: 'Stainless steel bottle found near Library Level 2',
    foundAt: new Date('2026-09-01'),
    campusLocation: 'Burwood Campus, Library Level 2',
    contactMethod: 'email',
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
    it('FI-01: should pass validation with all valid required fields (contactMethod: email)', async () => {
      const item = new FoundItem(getValidFoundItemData());
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-02: should pass validation with contactMethod collection when collectionLocation is provided', async () => {
      const data = {
        ...getValidFoundItemData(),
        contactMethod: 'collection',
        collectionLocation: 'Student Central Helpdesk',
      };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-03: should default status to "active"', async () => {
      const data = getValidFoundItemData();
      delete data.status;
      const item = new FoundItem(data);
      expect(item.status).to.equal('active');
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-04: should accept "resolved" status', async () => {
      const data = { ...getValidFoundItemData(), status: 'resolved' };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });
  });

  describe('[REQUIRED] Mandatory Field Validation', () => {
    it('FI-05: should fail validation if ownerId is missing', async () => {
      const data = getValidFoundItemData();
      delete data.ownerId;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.ownerId).to.exist;
    });

    it('FI-06: should fail validation if title is missing', async () => {
      const data = getValidFoundItemData();
      delete data.title;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.title).to.exist;
    });

    it('FI-07: should fail validation if category is missing', async () => {
      const data = getValidFoundItemData();
      delete data.category;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.category).to.exist;
    });

    it('FI-08: should fail validation if description is missing', async () => {
      const data = getValidFoundItemData();
      delete data.description;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.description).to.exist;
    });

    it('FI-09: should fail validation if campusLocation is missing', async () => {
      const data = getValidFoundItemData();
      delete data.campusLocation;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.campusLocation).to.exist;
    });

    it('FI-10: should fail validation if contactMethod is missing', async () => {
      const data = getValidFoundItemData();
      delete data.contactMethod;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.contactMethod).to.exist;
    });
  });

  describe('[TEMPORAL] Date Field Validation', () => {
    it('FI-11: should pass validation with a valid foundAt Date', async () => {
      const data = { ...getValidFoundItemData(), foundAt: new Date('2026-08-15T08:00:00Z') };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-12: should fail validation if foundAt date is missing', async () => {
      const data = getValidFoundItemData();
      delete data.foundAt;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.foundAt).to.exist;
    });
  });

  describe('[BOUNDARY] Photo Array Constraints (0-3 photos)', () => {
    it('FI-13: should pass boundary validation with 0 photos attached', async () => {
      const data = { ...getValidFoundItemData(), photos: [] };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-14: should pass boundary validation with exactly 3 photos attached', async () => {
      const data = {
        ...getValidFoundItemData(),
        photos: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ],
      };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });

    it('FI-15: should fail boundary validation when more than 3 photos are attached (>3 limit)', async () => {
      const data = {
        ...getValidFoundItemData(),
        photos: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
        ],
      };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.photos).to.exist;
      expect(err.errors.photos.message).to.equal(
        'A found item report can contain up to three photos.'
      );
    });
  });

  describe('[TYPE & ENUM] Enumeration and Allowed Values', () => {
    it('FI-16: should reject invalid contactMethod enum values', async () => {
      const data = { ...getValidFoundItemData(), contactMethod: 'phone' };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.contactMethod).to.exist;
    });

    it('FI-17: should reject invalid status enum values', async () => {
      const data = { ...getValidFoundItemData(), status: 'archived' };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.status).to.exist;
    });
  });

  describe('[CONDITIONAL] Business Logic Validation', () => {
    it('FI-18: should fail validation when contactMethod is "collection" but collectionLocation is missing', async () => {
      const data = {
        ...getValidFoundItemData(),
        contactMethod: 'collection',
      };
      delete data.collectionLocation;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.exist;
      expect(err.errors.collectionLocation).to.exist;
    });

    it('FI-19: should pass validation when contactMethod is "email" even without collectionLocation', async () => {
      const data = {
        ...getValidFoundItemData(),
        contactMethod: 'email',
      };
      delete data.collectionLocation;
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
    });
  });

  describe('[LENGTH / FORMAT] String Sanitization & Trimming', () => {
    it('FI-20: should trim leading and trailing whitespace from string fields', async () => {
      const data = {
        ...getValidFoundItemData(),
        title: '   Trimmed Title   ',
        category: '  Electronics  ',
        description: '  A description with padding  ',
        campusLocation: '  Building bc  ',
      };
      const item = new FoundItem(data);
      const err = await getValidationError(item);
      expect(err).to.be.undefined;
      expect(item.title).to.equal('Trimmed Title');
      expect(item.category).to.equal('Electronics');
      expect(item.description).to.equal('A description with padding');
      expect(item.campusLocation).to.equal('Building bc');
    });
  });
});

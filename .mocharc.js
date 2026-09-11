'use strict';

const { error } = require('dotenv').config({ path: '.env.test' });

if (error) {
  throw new Error(
    'Failed to load .env.test — copy .env.test.example to .env.test and ' +
      `point it at a dedicated test database. (${error.message})`
  );
}

module.exports = {
  spec: 'test/**/*.test.js',
  timeout: 10000,
  exit: true,
};


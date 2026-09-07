'use strict';

require('dotenv').config({ path: '.env.test' });

module.exports = {
  spec: 'test/**/*.test.js',
  timeout: 10000,
  exit: true,
};


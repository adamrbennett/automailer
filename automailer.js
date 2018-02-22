#!/usr/bin/env node

const program = require('commander'),
package = require('./package.json');

program
  .version(package.version)
  .command('test', 'run all tests')
  .parse(process.argv);
const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { ContextObject } = require('../src/ContextObject');
const querystring = require('querystring');

const cfg = new Config();

const tests = [
  // Version 1.0
  {
    input: 'rft_id=1&someBadKey=whatever',
    admindata: { rft: { id: '1' } },
    metadata: {},
  },
  {
    input: 'rft.author=smith&rft.title=water',
    admindata: {},
    metadata: { rft: { author: 'smith', title: 'water' } },
  },

  // Version 0.1
  {
    input: '',
    admindata: {},
    metadata: {},
  },
  {
    input: 'id=1',
    admindata: {},
    metadata: { rft: { id: '1' } },
  },
  {
    input: 'author=smith&title=water',
    admindata: {},
    metadata: { rft: { author: 'smith', btitle: 'water' } },
  },
];

describe('analyse OpenURL', () => {
  tests.forEach(test => {
    it(`correctly analyses OpenURL '${test.input}'`, () => {
      const query = querystring.parse(test.input);
      const co = new ContextObject(cfg, query);
      const admindata = co.getAdmindata();
      assert.deepEqual(admindata, test.admindata, `admindata ${JSON.stringify(admindata, null, 2)} does not match expected ${JSON.stringify(test.admindata, null, 2)}`);
      const metadata = co.getMetadata();
      assert.deepEqual(metadata, test.metadata, `metadata ${JSON.stringify(metadata, null, 2)} does not match expected ${JSON.stringify(test.metadata, null, 2)}`);
    });
  });
});

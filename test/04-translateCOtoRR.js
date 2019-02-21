const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { ContextObject } = require('../src/ContextObject');
const { ReshareRequest } = require('../src/ReshareRequest');
const querystring = require('querystring');
const isuuid = require('isuuid');

const cfg = new Config();

const tests = [
  {
    input: '',
    output: {},
  },
  {
    input: 'rft.title=water',
    output: { title: 'water' },
  },
  {
    input: 'rft.btitle=water',
    output: { title: 'water' },
  },
  {
    input: 'title=water',
    output: { title: 'water' },
  },
  {
    // Our heuristic for a v1.0 OpenURL is the inclusion of an "rft."
    // or "rft_" key, so we need to include this in order for ctx_id
    // to be recognised.
    input: 'ctx_id=123&rft.title=water',
    output: { id: '123', title: 'water' },
  },
  {
    input: 'ctx_id=123&rft.title=Xenoposeidon&rft.au=Taylor&req_id=@SomeGuy&svc_id=fulltext',
    output: {
      author: 'Taylor',
      id: '123',
      patronReference: '@SomeGuy',
      title: 'Xenoposeidon',
      serviceType: 'fulltext',
    },
  },
  {
    input: 'spage=45&epage=72',
    output: {
      startPage: "45",
      numberOfPages: 28, // Calculated from start and end pages
    }
  },
  {
    input: 'pages=453-491',
    output: {
      startPage: "453", // Extracted from page-range
      numberOfPages: 39, // Calculated from page-range
    }
  },
  {
    input: 'pages=453x-491',
    output: {
      // Nothing can be calculated from a malformed page-range
    }
  },
  {
    input: 'spage=996&pages=453-491',
    output: {
      startPage: "996", // Wins over start-page extracted from page-range
      numberOfPages: 39, // Calculated from page-range
    }
  },
];

describe('translate ContextObject to ReshareRequest', () => {
  tests.forEach((test, i) => {
    it(`correctly translates ContextObject '${test.input}'`, () => {
      const query = querystring.parse(test.input);
      const co = new ContextObject(cfg, query);
      const rr = new ReshareRequest(co);
      const output = rr.getRequest();
      if (isuuid(output.id)) delete output.id; // ignore auto-generated IDs
      assert.deepEqual(output, test.output, `output ${JSON.stringify(output, null, 2)} does not match expected ${JSON.stringify(test.output, null, 2)}`);
    });
  });
});

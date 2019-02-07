const { describe, it } = require('mocha');
const { assert } = require('chai');
const { ContextObject } = require('../ContextObject');
const { translateCOtoRR } = require('../ReshareRequest');
const querystring = require('querystring');
const isuuid = require('isuuid');

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
      "author": "Taylor",
      "id": "123",
      "patronReference": "@SomeGuy",
      "title": "Xenoposeidon",
      "serviceType": "fulltext",
    },
  }
];

describe('translate ContextObject to ReshareRequest', () => {
  tests.forEach((test, i) => {
    it(`correctly translates ContextObject '${test.input}'`, () => {
      const query = querystring.parse(test.input);
      const co = new ContextObject(query);
      const output = translateCOtoRR(co);
      if (isuuid(output.id)) delete output.id; // ignore auto-generated IDs
      assert.deepEqual(output, test.output, `output ${JSON.stringify(output, null, 2)} does not match expected ${JSON.stringify(test.output, null, 2)}`);
    });
  });
});

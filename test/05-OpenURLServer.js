const { describe, it, after } = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
const _ = require('lodash');
const { Config } = require('../src/Config');
const { OpenURLServer } = require('../src/OpenURLServer');

chai.use(chaiHttp);
const app = (new OpenURLServer(new Config({ loggingCategories: '' })));

const tests = [
  {
    input: 'rft_id=123',
    checks: [
      ['admindata.rft.id', '123'],
    ],
  },
  {
    input: 'id=123&issn=1234-5678&date=1998&volume=12&issue=2&spage=134',
    checks: [
      ['admindata.rft.id', '123'],
      ['metadata.rft.issn', '1234-5678'],
      ['metadata.rft.date', '1998'],
      ['metadata.rft.volume', '12'],
      ['metadata.rft.issue', '2'],
      ['metadata.rft.spage', '134'],
    ],
  },
  {
    input: 'id=doi:123/345678&id=pmid:202123',
    checks: [
      ['admindata.rft.id.0', 'doi:123/345678'],
      ['admindata.rft.id.1', 'pmid:202123'],
    ],
  },
];

describe('send OpenURLs to server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  tests.forEach(test => {
    it(`correctly returns parsed OpenURL '${test.input}'`, async() => {
      const res = await requester.get(`/?${test.input}&svc_id=contextObject`);
      assert.equal(res.status, 200);
      const data = JSON.parse(res.text);
      test.checks.forEach(([path, value]) => {
        assert.equal(_.get(data, path), value);
      });
    });
  });

  after(() => {
    requester.close();
    server.close();
  });
});

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
    input: 'rft_id=123&req.emailAddress=mike@indexdata.com&svc.pickupLocation=loc123',
    checks: [
      ['admindata.rft.id', '123'],
      ['metadata.req.emailAddress', 'mike@indexdata.com'],
      ['metadata.svc.pickupLocation', 'loc123'],
    ],
  },
  {
    input: 'id=123&issn=1234-5678&date=1998&volume=12&issue=2&spage=134&req.emailAddress=x&svc.pickupLocation=y',
    checks: [
      ['metadata.rft.id', '123'],
      ['metadata.rft.issn', '1234-5678'],
      ['metadata.rft.date', '1998'],
      ['metadata.rft.volume', '12'],
      ['metadata.rft.issue', '2'],
      ['metadata.rft.spage', '134'],
    ],
  },
  {
    input: 'id=doi:123/345678&id=pmid:202123&req.emailAddress=x&svc.pickupLocation=y',
    checks: [
      ['metadata.rft.id.0', 'doi:123/345678'],
      ['metadata.rft.id.1', 'pmid:202123'],
    ],
  },
  {
    input: 'rft.id=1&svc.ntries=1',
    messages: [
      [true, /Please complete your request/],
      [true, /Please supply an email address/],
      [true, /Please supply a pickup location/],
    ],
  },
  {
    input: 'rft.id=1&req.emailAddress=x&svc.ntries=1',
    messages: [
      [false, /Please supply an email address/],
      [true, /Please supply a pickup location/],
    ],
  },
  {
    input: 'rft.id=1&svc.pickupLocation=x&svc.ntries=1',
    messages: [
      [true, /Please supply an email address/],
      [false, /Please supply a pickup location/],
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

      let data;
      try {
        data = JSON.parse(res.text);
      } catch (e) {
        test.messages.forEach(([shouldMatch, regexp]) => {
          if (shouldMatch) {
            assert.match(res.text, regexp);
          } else {
            assert.notMatch(res.text, regexp);
          }
        });
        return;
      }
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

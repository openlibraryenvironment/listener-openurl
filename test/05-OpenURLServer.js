const { describe, it, after } = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
const _ = require('lodash');
const { Config } = require('../src/Config');
const { OpenURLServer } = require('../src/OpenURLServer');

chai.use(chaiHttp);
const app = (new OpenURLServer(new Config({
  // loggingCategories: 'error,start,okapi,co,rr,admindata,metadata,flow',
  loggingCategories: '',
  withoutOkapi: true,
  services: {
    'US-EAST': {
      reqIdToLower: true,
      reqIdRegex: 'abc-(.*)',
      reqIdReplacement: '$1-b',
      reqIdHeader: 'x-remote-user'
    }
  }
})));

const tests = [
  {
    input: 'rft_id=123&rft.title=Sauroposeidon&rft.au=Wedel&rft.date=1999&svc.pickupLocation=loc123',
    checks: [
      ['admindata.rft.id', '123'],
      ['metadata.rft.title', 'Sauroposeidon'],
      ['metadata.rft.au', 'Wedel'],
      ['metadata.rft.date', '1999'],
      ['metadata.svc.pickupLocation', 'loc123'],
    ],
  },
  {
    input: 'rft_id=123&req.emailAddress=mike@indexdata.com&svc.pickupLocation=loc123',
    checks: [
      ['admindata.rft.id', '123'],
      ['metadata.req.emailAddress', 'mike@indexdata.com'],
      ['metadata.svc.pickupLocation', 'loc123'],
    ],
  },
  {
    input: 'rft_id=123&req_id=456&svc.pickupLocation=loc123',
    headers: { 'X-Remote-User': 'Abc-Xyz-789' },
    checks: [
      ['admindata.rft.id', '123'],
      ['admindata.req.id', 'xyz-789-b'],
      ['metadata.svc.pickupLocation', 'loc123'],
    ],
  },
  {
    input: 'id=123&issn=1234-5678&date=1998&volume=12&issue=2&spage=134&title=water&au=smith&svc.pickupLocation=y',
    checks: [
      ['metadata.rft.id', '123'],
      ['metadata.rft.issn', '1234-5678'],
      ['metadata.rft.date', '1998'],
      ['metadata.rft.volume', '12'],
      ['metadata.rft.issue', '2'],
      ['metadata.rft.spage', '134'],
      ['metadata.rft.title', 'water'],
      ['metadata.rft.au', 'smith'],
    ],
  },
  {
    input: 'id=doi:123/345678&id=pmid:202123&title=t&au=a&date=d&svc.pickupLocation=y',
    checks: [
      ['metadata.rft.id.0', 'doi:123/345678'],
      ['metadata.rft.id.1', 'pmid:202123'],
    ],
  },
  {
    input: 'rft_id=1&svc.ntries=1&svc.noPickupLocation=1&',
    messages: [
      [true, /Confirm request/],
      [false, /Please supply an email address/],
      [true, /Please supply a pickup location/],
    ],
  },
  {
    input: 'rft.id=1&req.emailAddress=x&svc.ntries=1&svc.noPickupLocation=1',
    messages: [
      [false, /Please supply an email address/],
      [false, /Please supply a pickup location/],
    ],
  },
  {
    input: 'rft.id=1&svc.pickupLocation=x&svc.ntries=1&svc.noPickupLocation=1',
    messages: [
      [false, /Please supply an email address/],
      [false, /Please supply a pickup location/], // Because of the noPickupLocation element
    ],
  },
];

describe('05. send OpenURLs to server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  tests.forEach(test => {
    it(`correctly returns parsed OpenURL '${test.input}'`, async () => {
      const res = await requester
        .get(`/US-EAST?${test.input}&svc_id=contextObject`)
        .set(test.headers || {});
      assert.equal(res.status, 200);

      let data;
      try {
        data = JSON.parse(res.text);
      } catch (e) {
        if (!test.messages) throw e;
        test.messages.forEach(([shouldMatch, regexp]) => {
          if (shouldMatch) {
            assert.match(res.text, regexp);
          } else {
            assert.notMatch(res.text, regexp);
          }
        });
        return;
      }
      (test.checks || []).forEach(([path, value]) => {
        assert.equal(_.get(data, path), value);
      });
    });
  });

  after(() => {
    requester.close();
    server.close();
  });
});

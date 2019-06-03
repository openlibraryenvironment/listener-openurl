// This is similar to 05-OpenURLServer.js but its purpose is to test
// that we can lodge requests of various kinds with the
// integration-testing server. As per PR-30, we want to exercise three cases:
//
//   * Create request for monographic item via OpenURL
//   * Create request for multi-volume monograph via OpenURL
//   * Create request for serial volume via OpenURL

const { describe, it, after } = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
const _ = require('lodash');
const { Config } = require('../../src/Config');
const { OpenURLServer } = require('../../src/OpenURLServer');

chai.use(chaiHttp);
const app = (new OpenURLServer(new Config({ loggingCategories: '', filename: 'config/caliban.json' })));

const tests = [
  {
    title: 'monographic item',
    input: [
      'rft_id=123',
      'rft.genre=book',
      'rft.aulast=Hallett',
      'rft.aufirst=Mark',
      'rft.auinit=M',
      'rft.auinit1=M',
      'rft.auinitm=',
      'rft.isbn=978-1421420288',
      'rft.title=The Sauropod Dinosaurs: Life in the Age of Giants',
      'rft.stitle=The Sauropod Dinosaurs',
      'rft.pages=1-336',
      'rft.date=2016',
      'rft.pub=Johns Hopkins University Press',
      'rft.place=Baltimore, MD',
    ].join('&'),
    checks: [
      ['publicationType', 'Book'],
      ['author', 'Hallett'],
      // XXX No ISBN in the ReshareRequest object yet
      ['title', 'The Sauropod Dinosaurs: Life in the Age of Giants'],
      ['startPage', '1'],
      ['numberOfPages', 336],
      ['publicationDate', '2016'],
      ['publisher', 'Johns Hopkins University Press'],
      ['placeOfPublication', 'Baltimore, MD'],
    ],
  },
  // XXX What is a "multi-volume monograph"?
  // XXX And do we really want a "serial volume"?
];

describe('send OpenURLs to server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  tests.forEach(test => {
    it(`correctly translates OpenURL for ${test.title}`, async() => {
      const res = await requester.get(`/?${test.input}&svc_id=reshareRequest`);
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

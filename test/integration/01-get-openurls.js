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
  {
    title: 'multi-volume monograph', // One volume of an encyclopaedia
    input: [
      'rft.genre=book',
      'rft.aulast=Encyclopaedia Britannica',
      'rft.isbn=0852296330',
      'rft.title=The New Encyclopaedia Britannica (15th Ed.)',
      'rft.stitle=Britannica',
      'rft.date=1998',
      'rft.pub=Encyclopaedia Britannica',
      'rft.place=Chicago, IL',
      'rft.volume=9'
    ].join('&'),
    checks: [
      ['publicationType', 'Book'],
      ['author', 'Encyclopaedia Britannica'],
      // XXX No ISBN in the ReshareRequest object yet
      ['title', 'The New Encyclopaedia Britannica (15th Ed.)'],
      ['publicationDate', '1998'],
      ['publisher', 'Encyclopaedia Britannica'],
      ['placeOfPublication', 'Chicago, IL'],
      ['volume', 9],
    ],
  },
  {
    title: 'serial volume', // Issues are bound, and lent as a single item
    input: [
      'rft.genre=journal',
      'rft.issn=0272-4634',
      'rft.title=Journal of Vertebrate Paleontology',
      'rft.stitle=JVP',
      'rft.volume=29',
      'rft.date=2010',
      'rft.pub=Taylor %26 Francis',
    ].join('&'),
    checks: [
      ['publicationType', 'Journal'],
      // XXX No ISSN in the ReshareRequest object yet
      ['title', 'Journal of Vertebrate Paleontology'],
      ['volume', '29'],
      ['publicationDate', '2010'],
      ['publisher', 'Taylor & Francis'],
    ],
  },
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

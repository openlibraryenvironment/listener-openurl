const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { ContextObject } = require('../src/ContextObject');
const { ReshareRequest } = require('../src/ReshareRequest');
const querystring = require('querystring');
const isuuid = require('isuuid');

const cfg = new Config({ noAutoPatron: 1 });

const tests = [
  {
    input: '',
    output: {},
  },
  {
    input: 'rft.title=water&rft.btitle=fish',
    output: { title: 'water' },
  },
  {
    input: 'rft.btitle=water&rft.atitle=fish',
    output: { title: 'water' },
  },
  {
    input: 'rft.atitle=water&rft.jtitle=fish',
    output: { title: 'water', stitle: 'fish' },
  },
  {
    input: 'rft.jtitle=water',
    output: { title: 'water', stitle: 'water' },
  },
  {
    input: 'title=water',
    output: { title: 'water' },
  },
  {
    input: 'rft.au=kernighan',
    output: { author: 'kernighan' },
  },
  {
    input: 'rft.aulast=kernighan',
    output: { author: 'kernighan' },
  },
  {
    input: 'rft.aufirst=brian',
    output: { author: 'brian' },
  },
  {
    input: 'rft.date=2017',
    output: { publicationDate: '2017' },
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
      patronIdentifier: '@SomeGuy',
      title: 'Xenoposeidon',
      serviceType: 'fulltext',
    },
  },
  {
    input: 'ctx_id=123&rft.au=Taylor&rft.volume=50&rft.issue=6&rft.pages=1547-1564',
    output: {
      author: 'Taylor',
      id: '123',
      volume: '50',
      issue: '6',
      startPage: '1547',
      numberOfPages: 18,
    },
  },
  {
    input: 'spage=45&epage=72',
    output: {
      startPage: '45',
      numberOfPages: 28, // Calculated from start and end pages
    }
  },
  {
    input: 'pages=453-491',
    output: {
      startPage: '453', // Extracted from page-range
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
      startPage: '996', // Wins over start-page extracted from page-range
      numberOfPages: 39, // Calculated from page-range
    }
  },
  { input: 'genre=journal', output: { publicationType: 'Journal' }, },
  { input: 'genre=article', output: { publicationType: 'Journal' }, },
  { input: 'genre=book', output: { publicationType: 'Book' }, },
  { input: 'genre=bookitem', output: { publicationType: 'Book' }, },
  { input: 'genre=conference', output: { publicationType: 'Other' }, },
  { input: 'genre=preprint', output: { publicationType: 'Other' }, },
  { input: 'genre=proceeding', output: { publicationType: 'Other' }, },
  {
    input: [
      'issn=2376-5992',
      'isbn=9780253213136',
      'coden=NATUAS',
      'sici=10.1002/0002-8231(199601)47:1<23:TDOMII>2.0.TX;2-2',
      'bici=0226103900(1969)<15:DRNAB>2.2.TX;1-9',
      'eissn=1937-2809',
      'part=3',
      'artnum=78214',
      'ssn=spring',
      'quarter=2',
    ].join('&'),
    output: {
      issn: '2376-5992',
      isbn: '9780253213136',
      coden: 'NATUAS',
      sici: '10.1002/0002-8231(199601)47:1<23:TDOMII>2.0.TX;2-2',
      bici: '0226103900(1969)<15:DRNAB>2.2.TX;1-9',
      eissn: '1937-2809',
      part: '3',
      artnum: '78214',
      ssn: 'spring',
      quarter: '2',
    }
  },
  {
    input: 'rft_id=12345&rft.btitle=fish&req_id=mike',
    output: { title: 'fish', systemInstanceIdentifier: '12345', patronIdentifier: 'mike' },
  },
  {
    input: 'rft_id=12345&rft.btitle=fish&req_id=mike&rft.identifier_illiad=123',
    output: {
      title: 'fish',
      systemInstanceIdentifier: '12345',
      patronIdentifier: 'mike',
      requestIdentifiers: [
        {
          'identifierType': 'illiad',
          'identifier': '123'
        }
      ]
    },
  },
  {
    input: 'req.emailAddress=mike@indexdata.com&svc.pickupLocation=ABC&svc.note=Urgent',
    output: { patronEmail: 'mike@indexdata.com', pickupLocationSlug: 'ABC', patronNote: 'Urgent' },
  },
];

describe('04. translate ContextObject to ReshareRequest', () => {
  tests.forEach((test, i) => {
    it(`correctly translates ContextObject '${test.input}'`, () => {
      const query = querystring.parse(test.input);
      const co = new ContextObject(cfg, query);
      const rr = new ReshareRequest(co);
      const output = rr.getRequest();
      delete output.isRequester; // ignore randomly generated boolean
      if (isuuid(output.id)) delete output.id; // ignore auto-generated IDs
      assert.deepEqual(output, test.output, `output ${JSON.stringify(output, null, 2)} does not match expected ${JSON.stringify(test.output, null, 2)}`);
    });
  });
});

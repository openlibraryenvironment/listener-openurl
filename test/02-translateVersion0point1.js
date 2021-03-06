const { describe, it } = require('mocha');
const { assert } = require('chai');
const { translateVersion0point1 } = require('../src/ContextObject');
const querystring = require('querystring');

const data = [
  {
    input: '',
    output: '',
  },
  {
    input: 'id=1',
    output: 'rft.id=1',
  },
  {
    input: 'author=smith&title=water',
    output: 'rft.author=smith&rft.title=water&rft.btitle=water',
  },
  {
    input: 'issn=1234-5678&date=1998&volume=12&issue=2&spage=134',
    output: 'rft.issn=1234-5678&rft.date=1998&rft.volume=12&rft.issue=2&rft.spage=134',
  },
  {
    input: 'sid=EBSCO:MFA&id=pmid:203456&pid=%3Cauthor%3ESmith%2C%20Paul%20%3B%20Klein%2C%20Calvin%3C%2Fauthor%3E%26%3Cyr%3E98%2F1%3C%2Fyr%3E',
    output: 'rfr_id=EBSCO%3AMFA&rft.id=pmid%3A203456&rft_dat=%3Cauthor%3ESmith%2C%20Paul%20%3B%20Klein%2C%20Calvin%3C%2Fauthor%3E%26%3Cyr%3E98%2F1%3C%2Fyr%3E',
  },
  {
    input: 'id=1&svc_id=contextObject',
    output: 'rft.id=1&svc_id=contextObject',
  },
  {
    input: 'genre=book&title=water',
    output: 'rft.genre=book&rft.title=water&rft.btitle=water',
  },
  {
    input: 'genre=article&title=water',
    output: 'rft.genre=article&rft.title=water&rft.jtitle=water',
  },
  {
    input: 'genre=article&atitle=water',
    output: 'rft.genre=article&rft.atitle=water',
  },
  {
    input: 'req.emailAddress=mike@indexdata.com&svc.pickupLocation=ABC&svc.note=Urgent',
    output: 'req.emailAddress=mike%40indexdata.com&svc.pickupLocation=ABC&svc.note=Urgent',
  },
];

describe('02. translate v0.1 OpenURL to v1.0', () => {
  it('translates version 0.1 OpenURLs', () => {
    data.forEach(val => {
      const { input, output } = val;
      const parsed = querystring.parse(input);
      const translated = translateVersion0point1(parsed);
      const v10 = querystring.stringify(translated);
      assert.equal(v10, output, `${input} conversion failed`);
    });
  });
});

const { describe, it } = require('mocha');
const { assert } = require('chai');
const { translateVersion0point1 } = require('../src/ContextObject');
const querystring = require('querystring');

const data = [
  [
    '',
    '',
  ],
  [
    'id=1',
    'rft_id=1',
  ],
  [
    'author=smith&title=water',
    'rft.author=smith&rft.btitle=water',
  ],
  [
    'issn=1234-5678&date=1998&volume=12&issue=2&spage=134',
    'rft.issn=1234-5678&rft.date=1998&rft.volume=12&rft.issue=2&rft.spage=134',
  ],
  [
    'sid=EBSCO:MFA&id=pmid:203456&pid=%3Cauthor%3ESmith%2C%20Paul%20%3B%20Klein%2C%20Calvin%3C%2Fauthor%3E%26%3Cyr%3E98%2F1%3C%2Fyr%3E',
    'rfr_id=EBSCO%3AMFA&rft_id=pmid%3A203456&rft_dat=%3Cauthor%3ESmith%2C%20Paul%20%3B%20Klein%2C%20Calvin%3C%2Fauthor%3E%26%3Cyr%3E98%2F1%3C%2Fyr%3E',
  ],
  [
    'id=1&svc_id=contextObject',
    'rft_id=1&svc_id=contextObject',
  ],
];

describe('translate v0.1 OpenURL to v1.0', () => {
  it('translates version 0.1 OpenURLs', () => {
    data.forEach(val => {
      const [v01, expected] = val;
      const parsed = querystring.parse(v01);
      const translated = translateVersion0point1(parsed);
      const v10 = querystring.stringify(translated);
      assert.equal(v10, expected, `${v01} conversion failed`);
    });
  });
});

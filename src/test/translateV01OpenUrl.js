const { describe, it } = require('mocha');
const { assert } = require('chai');
const { translateVersion0point1 } = require('../ContextObject');
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

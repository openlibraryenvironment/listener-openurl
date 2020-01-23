const { describe, it } = require('mocha');
const { assert } = require('chai');
const { isVersion0point1 } = require('../src/ContextObject');
const querystring = require('querystring');

const v01urls = [
  '',
  'id=1',
  'author=smith&title=water',
];

const v10urls = [
  'rft_id=1',
  'rft.author=smith&rft.title=water',
];

describe('01. detect v0.1 OpenURL', () => {
  it('does recognise version 0.1 OpenURLs', () => {
    v01urls.forEach(val => {
      const parsed = querystring.parse(val);
      assert.equal(isVersion0point1(parsed), true, `${val} is v0.1`);
    });
  });
  it('does not recognise version 1.0 OpenURLs', () => {
    v10urls.forEach(val => {
      const parsed = querystring.parse(val);
      assert.equal(isVersion0point1(parsed), false, `${val} is not v0.1`);
    });
  });
});

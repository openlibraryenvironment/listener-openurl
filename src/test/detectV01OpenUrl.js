const { assert, expect } = require('chai');
const { isVersion0point1 } = require('../ContextObject');

const v01urls = [
  {},
  { id: '1' },
  { author: 'smith', title: 'water' },
];

const v10urls = [
  { rft_id: '1' },
  { 'rft.author': 'smith', 'rft.title': 'water' },
];

describe('detect v0.1 OpenURL', () => {
  it('does recognise version 0.1 OpenURLs', () => {
    v01urls.forEach(val => {
      assert.equal(isVersion0point1(val), true, `${JSON.stringify(val)} is v0.1`);
    });
  });
  it('does not recognise version 1.0 OpenURLs', () => {
    v10urls.forEach(val => {
      assert.equal(isVersion0point1(val), false, `${JSON.stringify(val)} is not v0.1`);
    });
  });
});

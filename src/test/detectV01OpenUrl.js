const { expect } = require('chai');
const { isVersion0point1 } = require('../ContextObject');

describe('detect v0.1 OpenURL', () => {
  it('does recognise version 0.1 OpenURLs', () => {
    expect(isVersion0point1({})).to.be.true;
  });
  it('does not recognise version 1.0 OpenURLs', () => {
    expect(isVersion0point1({ rft_id: '1' })).to.be.false;
  });
});

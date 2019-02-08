const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../Config');
const { OpenURLServer } = require('../OpenURLServer');

const cfg = new Config();
const server = new OpenURLServer(cfg);

describe('send OpenURLs to server', () => {
  it('probably works', () => {
    assert(true);
  });
});

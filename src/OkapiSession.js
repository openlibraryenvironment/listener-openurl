// Represents an open, authenticated session to an Okapi service.


class OkapiSession {
  constructor(cfg) {
    this.cfg = cfg;
  }

  post(path, content) {
    console.log('XXX OkapiSession.post not yet implemented');
  }
}


module.exports = { OkapiSession };

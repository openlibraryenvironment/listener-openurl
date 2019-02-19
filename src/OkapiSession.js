// Represents an open, authenticated session to an Okapi service.

const fetch = require('node-fetch');
const HTTPError = require('./HTTPError');

class OkapiSession {
  constructor(cfg) {
    this.cfg = cfg;
    cfg.log('okapi', 'making Okapi session');
    const values = cfg.getValues();
    const filename = cfg.getFilename();
    this.okapiUrl = values.okapiUrl;
    this.tenant = values.tenant;
    if (!this.okapiUrl) throw Error(`no okapiUrl defined in ${filename}`);
    if (!this.tenant) throw Error(`no tenant defined in ${filename}`);
  }

  login() {
    const { username, password } = this.cfg.getValues();
    this.cfg.log('okapi', `logging into Okapi as ${username}/${password}`);
    return this.post('/bl-users/login', { username, password })
      .then(res => {
        if (res.status !== 201) throw new HTTPError(res, 'cannot login to FOLIO');
        this.token = res.headers.get('x-okapi-token');
      });
  }

  post(path, payload) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-okapi-tenant': this.tenant,
    };
    if (this.token) headers['x-token-token'] = this.token;
    this.cfg.log('okapi', `POST to ${path}`);
    return fetch(`${this.okapiUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers
    });
  }
}


module.exports = { OkapiSession };

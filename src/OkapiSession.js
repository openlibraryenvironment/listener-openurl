// Represents an open, authenticated session to an Okapi service.

const fetch = require('node-fetch');
const HttpError = require('./HttpError');

class OkapiSession {
  constructor(cfg) {
    this.cfg = cfg;
    cfg.log('okapi', 'making Okapi session');
    const config = cfg.getConfig();
    this.okapiUrl = config.okapiUrl;
    this.tenant = config.tenant;
    if (!this.okapiUrl) throw Error(`no okapiUrl defined in ${cfg.configFile}`);
    if (!this.tenant) throw Error(`no tenant defined in ${cfg.configFile}`);
  }

  login() {
    const { username, password } = this.cfg.getConfig();
    this.cfg.log('okapi', `logging into Okapi as ${username}/${password}`);
    return this.post('/bl-users/login', { username, password })
      .then(res => {
        if (res.status !== 201) throw new HttpError(res, 'cannot login to FOLIO');
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
    console.log(`POST to ${path}:`, headers);
    return fetch(`${this.okapiUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers
    });
  }
}


module.exports = { OkapiSession };

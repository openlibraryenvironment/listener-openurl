// Represents an open, authenticated session to an Okapi service.

const fetch = require('node-fetch');
const HTTPError = require('./HTTPError');

class OkapiSession {
  constructor(cfg, label = 'main', values) {
    this.logger = cfg;
    this.label = label;
    if (!values) values = cfg.getValues();

    const filename = cfg.getFilename();
    ['okapiUrl', 'tenant', 'username', 'password'].forEach(param => {
      const val = values[param];
      if (!val) throw Error(`no ${param} defined for '${label}' in ${filename}`);
      this[param] = val;
    });

    cfg.log('okapi', `making Okapi session '${label}' for ${this.okapiUrl}`);
  }

  login() {
    const { username, password } = this;
    this.logger.log('okapi', `logging into Okapi session '${this.label}' as ${username}/${password}`);
    return this.post('/authn/login', { username, password })
      .then(res => {
        if (res.status !== 201) throw new HTTPError(res, `cannot login to FOLIO session '${this.label}'`);
        this.token = res.headers.get('x-okapi-token');
      })
      .catch(e => {
        console.log(`can not login to ${this.label}:`, e);
        // Do not set this.token
      });
  }

  getPickupLocations() {
    const headers = {
      'Accept': 'application/json',
      'x-okapi-tenant': this.tenant,
      'x-token-token': this.token,
    };
    const path = `/directory/entry?filters=tags.value%3D%3DPickup&perPage=100&stats=true`;
    this.logger.log('okapi', `GET for ${this.label} from ${path}`);
    return fetch(`${this.okapiUrl}${path}`, { headers })
      .then(res => {
        if (res.status !== 200) throw new HTTPError(res, `cannot fetch pickup locations for '${this.label}'`);
        return res.json().then((json) => {
          this.logger.log('json', this.label, json);
          this.pickupLocations = json.results.map(r => ({ id: r.id, code: r.lmsLocationCode, name: r.name }));
        });
      });
  }

  post(path, payload) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-okapi-tenant': this.tenant,
    };
    if (this.token) headers['x-token-token'] = this.token;
    this.logger.log('okapi', `POST for '${this.label}' to ${path}`);
    return fetch(`${this.okapiUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers
    });
  }
}


module.exports = { OkapiSession };

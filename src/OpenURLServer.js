// Creates an OpenURL server that contains a configured Koa app. It is
// perfectly OK to directly invoke Koa methods on that app.

const Koa = require('koa');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');

class OpenURLServer {
  constructor(cfg) {
    const okapi = new OkapiSession(cfg);

    this.app = new Koa();
    this.app.use(ctx => {
      const co = new ContextObject(cfg, ctx.query);
      cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
      cfg.log('admindata', JSON.stringify(co.getAdmindata(), null, 2));
      cfg.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
      const rr = new ReshareRequest(co);
      cfg.log('rr', JSON.stringify(rr.getRequest(), null, 2));
      okapi.post('/rs/patronrequests', rr);
      ctx.body = 'OpenURL request received\n';
    });
  }

  getApp() { return this.app; }
}

module.exports = { OpenURLServer };

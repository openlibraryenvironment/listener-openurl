// Creates an OpenURL server that contains a configured Koa app. It is
// perfectly OK to directly invoke Koa methods on that app.

const Koa = require('koa');
const _ = require('lodash');
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
      const admindata = co.getAdmindata();
      const metadata = co.getMetadata();
      cfg.log('admindata', JSON.stringify(admindata, null, 2));
      cfg.log('metadata', JSON.stringify(metadata, null, 2));

      const svc_id = _.get(admindata, ['svc', 'id']);
      if (svc_id === 'contextObject') {
        ctx.body = { admindata, metadata };
        return;
      }

      const rr = new ReshareRequest(co);
      cfg.log('rr', JSON.stringify(rr.getRequest(), null, 2));
      okapi.post('/rs/patronrequests', rr);
      ctx.body = 'OpenURL request received\n';
    });
  }

  getApp() { return this.app; }
}

module.exports = { OpenURLServer };

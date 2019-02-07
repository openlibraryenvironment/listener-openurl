const Koa = require('koa');
const { Config } = require('./Config');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');

const cfg = new Config();
const okapi = new OkapiSession(cfg);
const app = new Koa();

app.use(ctx => {
  const co = new ContextObject(cfg, ctx.query);
  cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  cfg.log('admindata', JSON.stringify(co.getAdmindata(), null, 2));
  cfg.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
  const rr = new ReshareRequest(co);
  cfg.log('rr', JSON.stringify(rr.getRequest(), null, 2));
  okapi.post('/rs/patronrequests', rr);
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
cfg.log('start', 'starting');

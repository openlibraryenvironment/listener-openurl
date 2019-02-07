const Koa = require('koa');
const { Config } = require('./Config');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');

const cfg = new Config();
const app = new Koa();

app.use(ctx => {
  const co = new ContextObject(ctx.query);
  cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  cfg.log('admindata', JSON.stringify(co.getAdmindata(), null, 2));
  cfg.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
  const reshareRequest = new ReshareRequest(co);
  cfg.log('rr', JSON.stringify(reshareRequest.getRequest(), null, 2));
  // POST the request to mod-rs
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
cfg.log('start', 'starting');

const Logger = require('categorical-logger');
const Koa = require('koa');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');

const l = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT);
const app = new Koa();

app.use(ctx => {
  const co = new ContextObject(ctx.query);
  l.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  l.log('admindata', JSON.stringify(co.getAdmindata(), null, 2));
  l.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
  const reshareRequest = new ReshareRequest(co);
  l.log('rr', JSON.stringify(reshareRequest.getRequest(), null, 2));
  // POST the request to mod-rs
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
l.log('start', 'starting');

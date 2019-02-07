const Logger = require('categorical-logger');
const Koa = require('koa');
const { ContextObject } = require('./ContextObject');

const l = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT);
const app = new Koa();

app.use(ctx => {
  const co = new ContextObject(ctx.query);
  l.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  l.log('admindata', JSON.stringify(co.getAdmindata(), null, 2));
  l.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
l.log('start', 'starting');

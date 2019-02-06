const Koa = require('koa');
const app = new Koa();
const Logger = require('categorical-logger');
const l = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT);
const { ContextObject } = require('./ContextObject');

app.use(ctx => {
  const co = new ContextObject(ctx.query);
  l.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  l.log('admin', JSON.stringify(co.getAdmin(), null, 2));
  l.log('metadata', JSON.stringify(co.getMetadata(), null, 2));
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
l.log('start', 'starting');

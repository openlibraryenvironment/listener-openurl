const { Config } = require('./Config');
const { OpenURLServer } = require('./OpenURLServer');

const cfg = new Config();
const server = new OpenURLServer(cfg);

server.getApp().listen(3000);
cfg.log('start', 'starting');

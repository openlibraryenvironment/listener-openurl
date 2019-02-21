const { Config } = require('./Config');
const { OpenURLServer } = require('./OpenURLServer');

const args = {};

// argv[0] is node, argv[1] is a program name, real args start at [2].
if (process.argv.length === 3) {
  args.filename = process.argv[2];
} else if (process.argv.length > 3) {
  console.error(`Usage: ${process.argv[1]} [<configFile>]`);
  process.exit(1);
}

const cfg = new Config(args);
const server = new OpenURLServer(cfg);
const port = 3012;

server.okapiLogin().then(res => {
  server.listen(port);
  cfg.log('start', `starting up on port ${port}`);
});

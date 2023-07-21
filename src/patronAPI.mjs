import { Config } from './Config.js';
import patronAPIServer from './patronAPIServer.mjs';

const args = {};

// argv[0] is node, argv[1] is a program name, real args start at [2].
if (process.argv.length === 3) {
  args.filename = process.argv[2];
} else if (process.argv.length > 3) {
  console.error(`Usage: ${process.argv[1]} [<configFile>]`);
  process.exit(1);
}

const cfg = new Config(args);
const port = process.env.PORT || cfg.getValues().listenPort || 3012;
const server = await patronAPIServer(cfg);
server.listen(port);
cfg.log('start', `starting up on port ${port}`);

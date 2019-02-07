const Logger = require('categorical-logger');

class Config {
  constructor(args) {
    // XXX Load other bits of config from file
    // XXX allow args to override
    this.logger = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT);
  }

  log(...args) { this.logger.log(...args); }
}

module.exports = { Config };

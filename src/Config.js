const fs = require('fs');
const Logger = require('categorical-logger');

class Config {
  constructor(args) {
    if (!args) args = {};
    this.configFile = args.configFile || 'config.json';
    const configText = fs.readFileSync(this.configFile, 'utf8');
    this.config = JSON.parse(configText);
    Object.keys(args).forEach(key => {
      this.config[key] = args[key];
    });

    this.logger = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT || this.config.loggingCategories);
  }

  log(...args) { this.logger.log(...args); }
}

module.exports = { Config };

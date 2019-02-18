const fs = require('fs');
const Logger = require('categorical-logger');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj, null, 2);
});

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

  getConfig() { return this.config; }
  log(...args) { this.logger.log(...args); }

  getTemplate(name) {
    const filename = this.config[`template.${name}`];
    const text = fs.readFileSync(filename, 'utf8');
    return Handlebars.compile(text);
  }
}

module.exports = { Config };

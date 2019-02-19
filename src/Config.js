const fs = require('fs');
const Logger = require('categorical-logger');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj, null, 2);
});

class Config {
  constructor(args) {
    if (!args) args = {};
    this.filename = args.filename || '../config/openurl.json';
    this.path = this.filename.indexOf('/') < 0 ? '.' : this.filename.replace(/(.*)\/.*/, '$1');
    console.log(`filename=${this.filename}, path=${this.path}`);
    const configText = fs.readFileSync(this.filename, 'utf8');
    this.values = JSON.parse(configText);
    Object.keys(args).forEach(key => {
      this.values[key] = args[key];
    });

    this.logger = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT || this.values.loggingCategories);
  }

  getValues() { return this.values; }
  getFilename() { return this.filename; }
  log(...args) { this.logger.log(...args); }

  getTemplate(name) {
    const filename = this.path + '/' + this.values[`template.${name}`];
    const text = fs.readFileSync(filename, 'utf8');
    return Handlebars.compile(text);
  }
}

module.exports = { Config };

const fs = require('fs');
const Logger = require('categorical-logger');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj, null, 2);
});

class Config {
  constructor(args) {
    if (!args) args = {};
    this.filename = args.filename || 'config/openurl.json';
    this.path = this.filename.indexOf('/') < 0 ? '.' : this.filename.replace(/(.*)\/.*/, '$1');
    const configText = fs.readFileSync(this.filename, 'utf8');
    this.values = JSON.parse(configText);
    Object.keys(args).forEach(key => {
      this.values[key] = args[key];
    });

    this.logger = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT || this.values.loggingCategories, process.env.LOGGING_PREFIX);
    this.cachedTemplates = {};
  }

  getValues() { return this.values; }
  getFilename() { return this.filename; }
  log(...args) { this.logger.log(...args); }

  readFile(filename) {
    return fs.readFileSync(this.path + '/' + filename, 'utf8');
  }

  getTemplate(name) {
    if (!this.cachedTemplates[name]) {
      const filename = this.values[`template.${name}`];
      if (!filename) throw Error(`no template '${name}'`);
      const text = this.readFile(filename);
      this.cachedTemplates[name] = Handlebars.compile(text);
    }
    return this.cachedTemplates[name];
  }
}

module.exports = { Config };

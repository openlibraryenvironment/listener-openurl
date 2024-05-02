const fs = require('fs');
const Logger = require('categorical-logger');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  const objWithoutBranding = { ...obj };
  delete objWithoutBranding.branding;
  return JSON.stringify(objWithoutBranding, null, 2);
});

function addSlashes(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

// Returns a JavaScript string which can be parsed with JSON.parse
Handlebars.registerHelper('encodedJson', function(obj) {
  const objWithoutBranding = { ...obj };
  delete objWithoutBranding.branding;
  const unquoted = JSON.stringify(objWithoutBranding, null, 2);
  return addSlashes(unquoted);
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

  getServiceValues(symbol) {
    return Object.assign({}, this.values, this.values?.services?.[symbol] ?? {});
  }

  getFilename() { return this.filename; }

  log(...args) { this.logger.log(...args); }

  readFile(filename) {
    return fs.readFileSync(this.path + '/' + filename, 'utf8');
  }

  runTemplate(name, values) {
    let template = this.cachedTemplates[name];
    if (!template || this.values.reloadTemplates) {
      const filename = this.values[`template.${name}`];
      if (!filename) throw Error(`no template '${name}'`);
      const text = this.readFile(filename);
      this.log('loadTemplate', filename);
      template = Handlebars.compile(text);
      this.cachedTemplates[name] = template;
    }

    return template({ ...values, branding: this.values.branding });
  }
}

module.exports = { Config };

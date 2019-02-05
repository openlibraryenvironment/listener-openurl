class ContextObject {
  constructor(query) {
    this.type = 'ContextObject';
    this.query = query;
  }

  query() { return this.query }
};

module.exports = ContextObject;

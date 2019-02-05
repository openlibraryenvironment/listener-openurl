// Represents an OpenURL 1.0 ContextObject, which consists of metadata
// and a set of entities representing the referent, requester, etc.
//
// The constructor makes this from a URL query. It sniffs the query to
// determine whether it represents a v0.1 OpenURL and if so translates
// it into a v1.0 OpenURL; then picks apart the various query elements
// to build the ContextObject structure.

const _ = require('lodash');


// The only formal requirement for a v1.0 OpenURLs is that it must
// contain a referent: which means at least one of the `rft_*` keys
// must be present: see table 13 in section 12.3.1 of the standard,
// ANSI/NISO Z239.88-2004. But in practice, we need to deal with
// malformed OpenURLs that include inline referent metadata as `rft.*`
// keys but lack the `rft_val_fmt` key that is mandatory for inline
// referent metadata. So to pick up on all v1.0 OpenURLs, we need to
// see whether there is any `rft_*` OR `rft.*` key.
//
function isVersion0point1(originalQuery) {
  const keys = Object.keys(originalQuery);
  return !_.some(keys, key => key.match(/^rft[_.]/));
}


// Most metadata keys simply get prefixed with "rft.", but "title" is
// special. It seems -- the OpenURL 1.0 standard is not really
// explicit about this -- that it becomes "jtitle" in the context of
// an article (and maybe some other genres) but "btitle" in the
// context of a book. So beware: some heuristics here.
//
// Note that values may be arrays (for repeated fields)
//
function translateVersion0point1(v01query) {
  const query = {};

  Object.keys(v01query).forEach(key => {
    const val = v01query[key];
    if (key === 'sid') {
      query.rfr_id = val;
    } else if (key === 'id') {
      query.rft_id = val;
    } else if (key === 'pid') {
      query.rft_dat = val;
    } else if (key === 'title') {
      const genre = v01query.genre;
      if (genre === 'article' || genre === 'proceeding') {
        query.jtitle = val;
      } else {
        query.btitle = val;
      }
    } else {
      query[`rft.${key}`] = val;
    }
  });

  return query;
}


function analyseQuery(query) {
  // XXX This will need some work
  return {
    metadata: null,
    entities: [],
  };
}


class ContextObject {
  constructor(originalQuery) {
    this.originalQuery = originalQuery;

    let query;
    if (isVersion0point1(originalQuery)) {
      this.type = '0.1';
      query = translateVersion0point1(originalQuery);
    } else {
      this.type = '1.0';
      query = originalQuery;
    }

    this.query = query;

    const parts = analyseQuery(query);
    this.metadata = parts.metadata;
    this.entities = parts.entities;
  }

  getOriginalQuery() { return this.Originalquery; }
  getType() { return this.type; }
  getQuery() { return this.query; }
  getMetadata() { return this.metadata; }
  getEntity(name) { return this.entity[name]; }
}


module.exports = {
  // For applications
  ContextObject,
  // ONLY FOR TESTING
  isVersion0point1,
  translateVersion0point1
};

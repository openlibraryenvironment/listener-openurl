// Represents a ReShare loan request
//
// The constructor makes this from an OpenURL ContextObject. The
// object we contruct conforms to the schema
//      https://github.com/openlibraryenvironment/mod-rs/blob/master/ramls/patronRequest.json

const _ = require('lodash');
const uuidv4 = require('uuid/v4');


function translateCOtoRR(co) {
  const a = co.getAdmindata();
  const m = co.getMetadata();
  const rr = {};

  // I assume this is the ID of the request itself
  rr.id = _.get(a, 'ctx.id') || uuidv4();

  // This all seems to be metadata about the requested item
  rr.title = _.get(m, 'rft.title') || _.get(m, 'rft.atitle') || _.get(m, 'rft.jtitle');
  rr.author = _.get(m, 'rft.au') || _.get(m, 'rft.aulast') || _.get(m, 'rft.aulast');

  // Administrative data about who is asking for what
  rr.patronReference = _.get(a, 'req.id');
  rr.serviceType = _.get(a, 'svc.id'); // No example of this in Z39.88

  // XXX No idea what any of these are until the schema gets bulked out
  // rr.state, rr.tags, rr.customProperties

  return rr;
}


class ReshareRequest {
  constructor(co) {
    this.co = co;
    this.rr = translateCOtoRR(co);
  }

  getContextObject() { return this.co; }
  getRequest() { return this.rr; }
}


module.exports = {
  // For applications
  ReshareRequest,
  // ONLY FOR TESTING
  translateCOtoRR,
};

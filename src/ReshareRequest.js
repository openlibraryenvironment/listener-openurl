// Represents a ReShare loan request
//
// The constructor makes this from an OpenURL ContextObject. The
// object we contruct conforms to the schema
//      https://github.com/openlibraryenvironment/mod-rs/blob/master/ramls/patronRequest.json
// But that schema is only documentation: the Real Truth is the Groovy object model:
//      .../mod-rs/grails-app/domain/org/olf/rs/PatronRequest.groovy

const _ = require('lodash');
const uuidv4 = require('uuid/v4');


function translateCOtoRR(co) {
  const a = co.getAdmindata();
  const m = co.getMetadata();
  const rr = {};

  // I assume this is the ID of the request itself
  rr.id = _.get(a, 'ctx.id') || uuidv4();
  // XXX publicationType

  // This all seems to be metadata about the requested item
  rr.title = _.get(m, 'rft.title') || _.get(m, 'rft.btitle') || _.get(m, 'rft.atitle') || _.get(m, 'rft.jtitle');
  rr.author = _.get(m, 'rft.au') || _.get(m, 'rft.aulast') || _.get(m, 'rft.aulast');
  // XXX subtitle
  // XXX sponsoringBody
  // XXX publisher
  // XXX placeOfPublication
  // XXX volume
  // XXX issue
  // XXX startPage
  // XXX numberOfPages
  // XXX publicationDate
  // XXX publicationDateOfComponent
  // XXX edition

  // Administrative data about who is asking for what
  rr.patronReference = _.get(a, 'req.id');
  rr.serviceType = _.get(a, 'svc.id'); // No example of this in Z39.88

  // XXX isRequester

  // XXX No idea what any of these are until the schema gets bulked out
  rr.state = undefined;
  // XXX numberOfRetries
  // XXX delayPerformingActionUntil
  // XXX pendingAction

  rr.tags = undefined;
  rr.customProperties = undefined;

  return _.pickBy(rr, val => val !== undefined);
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

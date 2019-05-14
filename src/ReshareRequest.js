// Represents a ReShare loan request
//
// The constructor makes this from an OpenURL ContextObject. The
// object we contruct conforms to the schema
//      https://github.com/openlibraryenvironment/mod-rs/blob/master/ramls/patronRequest.json
// But that schema is only documentation: the Real Truth is the Groovy object model:
//      .../mod-rs/grails-app/domain/org/olf/rs/PatronRequest.groovy

const _ = require('lodash');
const uuidv4 = require('uuid/v4');


// From OpenURL v0.1 specifcation, table in section 7, valid genres are:
//      journal, book, conference, article, preprint, proceeding, bookitem
//
// The OpenURL v1.0 specification is characteristically coy about
// genre, suggesting only that it's arbitrarily extensible and
// accidentally giving away a list of acceptable values in the XML
// Metadata Format for "journal" (Table 19). This is mostly the set of
// v0.1 genres, but with "book" and "bookitem" omitted (reasonably
// enough since this specific schema is only about journals) but with
// the addition of "issue" and "unknown".
//
// In mod-rs, publicationType is a refdata value, which means it can
// any of a set of values which are configured in the database. At
// present, the default set is [Book, Journal, Other], and
// unrecognised values are simply discarded rather than rejected.
//
function genreToPublicatonType(genre) {
  if (genre === 'journal' || genre === 'article') {
    return 'Journal';
  } else if (genre === 'book' || genre === 'bookitem') {
    return 'Book';
  } else if (genre) { // conference, preprint, proceeding
    return 'Other';
  } else {
    return genre;
  }
}


// Complete set of OpenURL v0.1 fields, drawn from table on pages 6-7 of the specification:
//      genre, aulast, aufirst, auinit, auinit1, auinitm, issn, eissn,
//      coden, isbn, sici, bici, title, stitle, atitle, volume, part,
//      issue, spage, epage, pages, artnum, date, ssn, quarter
//
// (There is no analogous list for OpenURL v1.0)
//
// We currently do not map the following OpenURL fields:
//      auinit, auinit1, auinitm
//      issn, eissn, coden, isbn, sici, bici
//      stitle (The abbreviated title of a bundle)
//      part (The part of a bundle, whatever that means)
//      artnum (The number of an individual item, in cases where there are no pages available)
//      ssn (The season of publication)
//      quarter (The quarter of publication)
//
function translateCOtoRR(co) {
  const a = co.getAdmindata();
  const m = co.getMetadata();
  const rr = {};

  // I assume this is the ID of the request itself
  rr.id = _.get(a, 'ctx.id') || uuidv4();
  rr.publicationType = genreToPublicatonType(_.get(m, 'rft.genre'));

  // This all seems to be metadata about the requested item
  rr.title = _.get(m, 'rft.title') || _.get(m, 'rft.btitle') || _.get(m, 'rft.atitle') || _.get(m, 'rft.jtitle');
  rr.author = _.get(m, 'rft.au') || _.get(m, 'rft.creator') || _.get(m, 'rft.aulast') || _.get(m, 'rft.aufirst');
  // rr.subtitle has no corresponding OpenURL field
  // rr.sponsoringBody has no corresponding OpenURL field
  rr.publisher = _.get(m, 'rft.pub');
  rr.placeOfPublication = _.get(m, 'rft.place');
  rr.volume = _.get(m, 'rft.volume');
  rr.issue = _.get(m, 'rft.issue');
  const spage = _.get(m, 'rft.spage');
  const epage = _.get(m, 'rft.epage');
  const pages = _.get(m, 'rft.pages');
  rr.startPage = spage;
  if (spage && epage) {
    rr.numberOfPages = epage - spage + 1;
  } else if (pages) {
    const match = pages.match(/^(\d+)-(\d+)$/);
    if (match) {
      rr.numberOfPages = match[2] - match[1] + 1;
      if (!spage) rr.startPage = match[1];
    }
  }
  rr.publicationDate = _.get(m, 'rft.date');
  // rr.publicationDateOfComponent has no corresponding OpenURL field
  // rr.edition has no corresponding OpenURL field

  // Administrative data about who is asking for what
  rr.patronReference = _.get(a, 'req.id');
  rr.serviceType = _.get(a, 'svc.id'); // No example of this in Z39.88

  // All of the following are probably used only internally
  // rr.isRequester
  // rr.state;
  // rr.numberOfRetries
  // rr.delayPerformingActionUntil
  // rr.pendingAction
  // rr.errorAction;
  // rr.preErrorStatus;
  // rr.awaitingProtocolResponse;
  // rr.rotaPosition;

  rr.tags = undefined;
  rr.customProperties = undefined;

  return _.pickBy(rr, val => val !== undefined);
}


class ReshareRequest {
  constructor(co) {
    this.co = co;
    this.rr = translateCOtoRR(co);
  }

  getRequest() { return this.rr; }
}


module.exports = { ReshareRequest };

// Represents a ReShare loan request
//
// The constructor makes this from an OpenURL ContextObject. The
// object we contruct conforms to the schema
//      https://github.com/openlibraryenvironment/mod-rs/blob/master/ramls/patronRequest.json
// But that schema is only documentation: the Real Truth is the Groovy object model:
//      .../mod-rs/grails-app/domain/org/olf/rs/PatronRequest.groovy

const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');


// From OpenURL v0.1 specification, table in section 7, valid genres are:
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
  if (genre === undefined) {
    return undefined;
  } else if (genre === 'bookitem') {
    return 'Chapter';
  } else if (genre === 'other') {
    return 'X-Other'; // XXX not part of https://illtransactions.org/opencode/2017/
  } else {
    return genre.charAt(0).toUpperCase() + genre.slice(1);
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
//      stitle (The abbreviated title of a bundle)
//
function translateCOtoRR(co) {
  const a = co.getAdmindata();
  const m = co.getMetadata();
  const rr = {};

  // I assume this is the ID of the request itself
  rr.id = _.get(a, 'ctx.id') || uuidv4();
  rr.publicationType = genreToPublicatonType(_.get(m, 'rft.genre'));
  rr.systemInstanceIdentifier = _.get(a, 'rft.id');

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
  rr.edition = _.get(m, 'rft.edition');
  rr.issn = _.get(m, 'rft.issn');
  rr.isbn = _.get(m, 'rft.isbn');
  rr.oclcNumber = _.get(m, 'rft.oclc');
  // rr.doi has no corresponding OpenURL field XXX but consider poking around in rft.id
  rr.coden = _.get(m, 'rft.coden');
  rr.sici = _.get(m, 'rft.sici');
  rr.bici = _.get(m, 'rft.bici');
  rr.eissn = _.get(m, 'rft.eissn');
  // rr.stitle has no corresponding OpenURL field
  rr.part = _.get(m, 'rft.part');
  rr.artnum = _.get(m, 'rft.artnum');
  rr.ssn = _.get(m, 'rft.ssn');
  rr.quarter = _.get(m, 'rft.quarter');
  // rr.titleOfComponent has no corresponding OpenURL field
  // rr.authorOfComponent has no corresponding OpenURL field
  // rr.sponsor has no corresponding OpenURL field
  // rr.informationSource has no corresponding OpenURL field

  // Administrative data about who is asking for what
  rr.patronIdentifier = _.get(a, 'req.id');
  // rr.patronSurname has no corresponding OpenURL field
  // rr.patronGivenName has no corresponding OpenURL field
  // rr.patronType has no corresponding OpenURL field
  // rr.sendToPatron has no corresponding OpenURL field
  rr.patronEmail = _.get(m, 'req.emailAddress');
  rr.patronNote = _.get(m, 'svc.note')?.substring(0, 255);
  rr.pickupLocationSlug = _.get(m, 'svc.pickupLocation');
  rr.neededBy = _.get(m, 'svc.neededBy');

  // These are non-standard fields in OpenURL 1.0
  rr.serviceType = _.get(a, 'svc.id'); // No example of this in Z39.88
  rr.isRequester = true;
  const copyrightType = _.get(m, 'rft.copyrightType');
  if (copyrightType) rr.copyrightType = { value: copyrightType };
  rr.subtitle = _.get(m, 'rft.subtitle');
  rr.sponsoringBody = _.get(m, 'rft.sponsoringBody');
  rr.authorOfComponent = _.get(m, 'rft.authorOfComponent');
  rr.titleOfComponent = _.get(m, 'rft.titleOfComponent');
  rr.pagesRequested = _.get(m, 'rft.pagesRequested');
  rr.stitle = _.get(m, 'rft.jtitle'); // stitle/jtitle is NOT a typo! See ../doc/openurls-for-reshare.md

  // All of the following are probably used only internally
  // rr.state;
  // rr.numberOfRetries
  // rr.delayPerformingActionUntil
  // rr.pendingAction
  // rr.errorAction;
  // rr.preErrorStatus;
  // rr.awaitingProtocolResponse;
  // rr.rotaPosition;

  const illiadIdentifier = _.get(m, 'rft.identifier_illiad');
  if (illiadIdentifier != null) {
    rr.requestIdentifiers = [];
    rr.requestIdentifiers.push({ 'identifierType': 'illiad', 'identifier': illiadIdentifier });
  }

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

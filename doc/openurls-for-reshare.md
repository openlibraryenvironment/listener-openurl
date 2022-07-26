# Formatting OpenURLs for ReShare

<!-- md2toc -l 2 openurls-for-reshare.md -->
* [Introduction](#introduction)
* [Keys](#keys)
    * [Special keys](#special-keys)
    * [Item metadata](#item-metadata)
    * [What constitutes a complete request?](#what-constitutes-a-complete-request)
* [Appendix: reading the source code](#appendix-reading-the-source-code)


## Introduction

The ReShare OpenURL resolver accepts any well-formed OpenURL, but for best results it is necessary to include specific fields. This document lists and describes these fields.

Although [v0.1 OpenURLs ](../standards/openurl-01.pdf) (those with simple keys like `id` and `isbn`) are understood, some of the elements required for best service cannot be expressed in the v0.1 vocabulary; so it is generally better to use [v1.0 OpenURLs](../standards/z39_88_2004_r2010.pdf) (those with compound keys like `rft_id` and `rft.isbn`).


## Keys

Here, we list only the v1.0 keys. Those who, for whatever reason, are keen to send v0.1 keys are encouraged to find the mapping in [the source code](#appendix-reading-the-source-code).


### Special keys

These are keys that have special meaning either to the resolver itself or to the underlying ReShare software:

* `res.org` -- If supplied, the value overrides the oranization identifier in the baseURL. Can be used to allow a single resolver configuration stanza to be used for multiple organizations.
* `ctx_id` -- a UUID to use as the identifier for the patron-request object that will be posted to ReShare. There is no reason ever to set this.
* `rft_id` -- The identifier of the sought work within the ReShare shared index, if known. This will be a UUID.
* `req_id` -- A unique reference to the patron placing the request, most probably obtained via an SSO system. This can take any form (UUID, small integer, email address, username, etc.) provided that it can be looked up in the borrowing system's NCIP server to obtain the patron's name and other details.
* `ctx_FAIL` -- If set to a true value, causes the POST of the patron request to fail. Only useful in development.
* `svc.pickupLocation` -- An indication of which pickup location the patron would prefer to get the item from once it has been delivered. This should usually be the code of a location or service-point known to the borrowing library's ILS. This is a mandatory field at present.
* `svc.neededBy` -- The date by which the patron needs the requested item, expressed in [ISO 8601 format](https://xkcd.com/1179/).
* `svc.note` -- A free-text note which the patron may elect to include along with the request.
* `svc_id` -- specifies what kind of service the resolver is being asked to provide. By default, it posts a patron request in a ReShare node, but certain values will change this:
  * `contextObject` -- returns a JSON representation of the parsed context-object: only useful for debugging.
  * `reshareRequest` -- returns a JSON representation of the constructed ReShare patron request: only useful for debugging.
  * `json` -- returns a JSON document indicating the status of the posted request. It contains the elements:
    * `status` -- the HTTP status of posting the patron request to ReShare (201 in the case of success).
    * `message` -- a content of the HTTP response from posting the patron request: only really of interest when an error occurs.
    * `contextObject` -- the parsed context-object.
    * `reshareRequest` -- the ReShare patron-request object generated from the context-object.
* `svc.logout` -- if set to `1`, the current Okapi session is forced to forget its authentication token; if it is set to any other true value, such as `2`, the token is set to an invalid value. In both cases, a re-login is required. This was added for testing only, and may well have no other use.
* `rft.genre` -- indicates the type of published resource the patron is seeking. Drawn from a small controlled vocabulary: `journal`, `article`, `book`, `bookitem`, `conference`, `preprint`, `proceeding`.
* `rft.identifier.illiad` -- If supplied creates a namespaced identifier that can be used to correlate iliiad requests inside reshare.

### Item metadata

The remaining keys simply describe the sought resource, and have their usual meanings as specified (admittedly very tersely) in the standards documents:

* `rft.title` `rft.btitle`, `rft.atitle`, `rft.jtitle` -- title, book title, article title and journal title, all of which are treated simply as "title" by ReShare.
* `rft.au`, `rft.creator`, `rft.aulast`, `rft.aufirst` -- author, creator, author last name and author first name, all of which are treated simply as "author" by ReShare.
* `rft.pub` -- publisher.
* `rft.place` -- place of publication.
* `rft.edition` -- edition (not mentioned in the standard but appearing in some examples).
* `rft.volume` -- volume.
* `rft.issue` -- issue.
* `rft.spage` -- start-page, i.e. the first page of an article.
* `rft.epage` -- end-page, i.e. the last page of an article. This is not directly used by ReShare, but the resolver uses it together with `page` to determine the _number_ of pages, which is.
* `rft.pages` -- A hyphen-separated page range such as `361-386`, which the resolver uses to determine the start-page and page-count.
* `rft.date` -- date of publication, usually just a year.
* `rft.issn` -- ISSN.
* `rft.isbn` -- ISBN.
* `rft.coden` -- CODEN, but who knows what _that_ is?
* `rft.sici` -- SICI. No, I have no idea, either.
* `rft.bici` -- BICI. Presumably some kind of in-joke.
* `rft.eissn` -- electronic ISSN.
* `rft.part` -- part. The original OpenURL document contains useless descriptions such as (for this one) "The part of a bundle". I'm not even going to try to expand on that.
* `rft.artnum` -- The number of an individual item, in cases where there are no pages available. 
* `rft.ssn` -- The season of publication, constrained (when provided) to be `winter`, `spring`, `summer` or `fall`. (All you gotta do is call.)
* `rft.quarter` -- Apparently there are publications out there which use neither issue numbers nor seasons of publication, but specify which quarter of the year an issue came out. For these, you will find `rft.quarter` is exactly what you are looking for. Let me know how that works out for you.


### What constitutes a complete request?

The criteria for whether a request is considered complete enough to be actionable are defined by the `hasBasicData` method in [the ContextObject class](../src/ContextObject.js). At present, the rule is that the the request must include _either_ `rft_id` (which identifies the requested item directly) _or_ all three of `rft.title`, `rft.au` and `rft.date`.


## Appendix: reading the source code

It is not necessary to read source code to know how to format OpenURLs for the ReShare OpenURL resolver; but for those who like to know The Real Truth:

The set of v0.1 keys that are recognised can be determined from the `translateVersion0point1` function [`ContextObject.js`](../src/ContextObject.js). This function specifies how v0.1 keys are translated into their v1.0 equivalents (and how some of the corresponding values are massaged along the way.)

Similarly, the set of v1.0 keys that are understood can be determined from the `translateCOtoRR` function in [`ReshareRequest.js`](../src/ReshareRequest.js). This specifies for v1.0 keys are translated into fields of a new ReShare patron-request object.



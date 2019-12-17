# Formatting OpenURLs for ReShare

<!-- md2toc -l 2 openurls-for-reshare.md -->
* [Introduction](#introduction)
* [Keys](#keys)
* [Appendix: reading the source code](#appendix-reading-the-source-code)


## Introduction

The ReShare OpenURL resolver accepts any well-formed OpenURL, but for best results it is necessary to include specific fields. This document lists and describes these fields.

Although [v0.1 OpenURLs ](../standards/openurl-01.pdf) (those with simple keys like `id` and `isbn`) are understood, some of the elements required for best service cannot be expressed in the v0.1 vocabulary; so it is generally better to use [v1.0 OpenURLs](../standards/z39_88_2004_r2010.pdf) (those with compound keys like `rft_id` and `rft.isbn`).


## Keys

* `ctx_id` -- id
* `rft.genre` -- publicationType (translated)
* `rft_id` -- systemInstanceIdentifier
* `rft.title` `rft.btitle`, `rft.atitle`, `rft.jtitle` -- title
* `rft.au`, `rft.creator`, `rft.aulast`, `rft.aufirst` -- author
* `rft.pub` -- publisher
* `rft.place` -- placeOfPublication
* `rft.volume` -- volume
* `rft.issue` -- issue
* `rft.spage` -- startPage
* `rft.epage` -- (with spage) -> numberOfPages
* `rft.pages` -- startPage and numberOfPages;
* `rft.date` -- publicationDate
* `rft.issn` -- issn
* `rft.isbn` -- isbn
* `rft.coden` -- coden
* `rft.sici` -- sici
* `rft.bici` -- bici
* `rft.eissn` -- eissn
* `rft.part` -- part
* `rft.artnum` -- artnum
* `rft.ssn` -- ssn
* `rft.quarter` -- quarter
* `req_id` -- patronReference
* `req.emailAddress` -- patronEmail
* `svc.note` -- patronNote
* `svc.pickupLocation` -- pickupLocation
* `svc_id` -- serviceType XXX and special uses


## Appendix: reading the source code

It is not necessary read source code to know how to format OpenURLs for the ReShare OpenURL resolver; but for those who like to know The Real Truth:

The set of v0.1 keys that are recognised can be determined from the `translateVersion0point1` function [`ContextObject.js`](../src/ContextObject.js). This function specifies how v0.1 keys are translated into their v1.0 equivalents (and how some of the corresponding values are massaged along the way.)

Similarly, the set of v1.0 keys that are understood can be determined from the `translateCOtoRR` function in [`ReshareRequest.js`](../src/ReshareRequest.js). This specifies for v1.0 keys are translated into fields of a new ReShare patron-request object.



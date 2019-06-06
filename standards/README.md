# OpenURL standards

There are two OpenURL standards in existence: the informal version 0.1, which was only ever published as an HTML page, and the ANSI/NISO standard Z39.88 (OpenURL 1.0). They are wildly incompatible, but we aim to support both. The relevant documents are as follows:

* [OpenURL v0.1](openurl-01.pdf) (and my [summary](OpenURL-v0.1-summary.txt))
* [OpenURL v1.0](z39_88_2004_r2010.pdf) (and my [summary](OpenURL-v1.0-summary.txt))

The OpenURL v1.0 document is wretched: an over-engineered account of an over-engineered standard that gives a dozen degrees of freedom that you don't want, then leaves you to figure out how to make sense of it all. Worst of all, it doesn't tell you what metadata keys are included. As unhelpfully explained in section 12.3.2 (**Z39.88-2004 Matrix Constraint Definitions for KEV Metadata Formats**), you find this information elsewhere, in the Registry at http://www.openurl.info/registry -- but that URL doesn't work: it just redirects to http://alcme.oclc.org/openurl/servlet/OAIHandler?verb=ListSets which hangs indefinitely.

Happily, the pages for the individual field-lists -- sorry, the Matrix Constraint Definitions for KEV Metadata Formats -- do work. Here are the important ones:

* [Book](http://alcme.oclc.org/openurl/servlet/OAIHandler/extension?verb=GetMetadata&metadataPrefix=mtx&identifier=info:ofi/fmt:kev:mtx:book)
* [Journal](http://alcme.oclc.org/openurl/servlet/OAIHandler/extension?verb=GetMetadata&metadataPrefix=mtx&identifier=info:ofi/fmt:kev:mtx:journal)

The punchline is that the v1.0 metadata sets are pretty similar to those of v0.1. The book format adds:

* `ausuffix` -- First author's name suffix. Qualifiers on an author's name such as "Jr.", "III" are entered here. e.g. Smith, Fred Jr. is recorded as "ausuffux=jr".
* `au` -- This data element contains the full name of a single author, e.g. "Smith, Fred M", "Harry S. Truman".
* `aucorp` -- Organization or corporation that is the author or creator of the book, e.g. "Mellon Foundation"
* `btitle` -- The title of the book. This can also be expressed as title, for compatibility with version 0.1. "moby dick or the white whale"
* `place` -- Place of publication. "New York"
* `pub` -- Publisher name. "Harper and Row"
* `edition` -- Statement of the edition of the book. This will usually be a phrase, with or without numbers, but may be a single number. E.g. "First edition", "4th ed."
* `tpages` -- Total pages. Total pages is the largest recorded number of pages, if this can be determined. E.g., "ix, 392 p." would be recorded as "392" in tpages. This data element is usually available only for monographs (books and printed reports). In some cases, tpages may not be numeric, e.g. "F36"
* `series` -- The title of a series in which the book or document was issued. There may also be an ISSN associated with the series.

The journal format also adds `ausuffix`, `au` and `aucorp`, plus:

* `jtitle` -- Journal title. Use the most complete title available. Abbreviated titles, when known, are records in stitle. This can also be expressed as title, for compatibility with version 0.1. "journal of the american medical association"
* `chron` -- Enumeration or chronology in not-normalized form, e.g. "1st quarter". Where numeric dates are also available, place the numeric portion in the "date" Key. So a recorded date of publication of "1st quarter 1992" becomes date=1992&chron=1st quarter. Normalized indications of chronology can be provided in the ssn and quarter Keys.


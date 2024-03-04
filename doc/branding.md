# Branding the OpenURL resolver for customers

<!-- md2toc -l 2 branding.md -->
* [Background](#background)
* [Configuration-based branding](#configuration-based-branding)
* [Upgrading](#upgrading)


## Background

[The ReShare OpenURL resolver](https://github.com/openlibraryenvironment/listener-openurl) generates several HTML forms which are presented to users as part of the process of placing a request:
* `form1` -- generating a new request with a blank form
* `form2` -- confirming a request that is already largely complete
* `good` -- confirmation that a request has been successfully placed
* `bad` -- notification than the request could not be placed. (**Note.** This is presently not used, as the resolver generates its own static message. It seems this change was made by accident, and I plan to reverse it.)

Each of these pages is generated from a Handlebars template in [`config/templates`](../config/templates/).

Branding the resolver for a specific customer can be done by modifying these files and the CSS stylesheets and images that they reference, which are in the [`/config/htdocs/static`](../config/htdocs/static) area. This provides a very powerful mechanism, but one that entails maintaining many sets of slightly different forms -- one set per customer -- with all the potential for confusion and error that this involves. in particular, handling changes to the master copy of a form included with the software will in general require corresponding edits to be made to each version of the form that has been branded for a specific customer.


## Configuration-based branding

In practice, it turns out that the customer-specific branding is limited to a few minor changes: customer name, background colour, logo, link when clicking the logo. Rather than making new, slightly divergent, copies of the HTML templates to accomodate such minor changes, it's more efficient to maintain a single customer-neutral template and inject branding information into it. This is  the subject of [PR-1649](https://openlibraryfoundation.atlassian.net/browse/PR-1649).

As of release 1.6.0, branding can be placed in the top-level configuration file (usually [`config/openurl.json`](../config/openurl.json)). It consists of a single top-level key, `branding`, which contains (currently) four strings, keyed as follows:
* `backgroundColor` -- The colour used for the background on all four forms, in any form supported by CSS.
* `customerName` -- A string representing the name by which the customer is known on the forms.
* `logoUrl` -- A link to a small image used as a logo: absolute, or relative to the resolver's [`config/htdocs`](../config/htdocs) directory.
* `logoLink` -- A URL which is the target when clicking on the logo, typically the home page of the customer organization.

For example:
```
  "branding": {
    "backgroundColor": "#007ebd",
    "customerName": "PALCI E-ZBorrow",
    "logoUrl": "/static/logo.png",
    "logoLink": "http://www.palci.org/"
  },
```

These strings are interpolated into the HTML templates where tokens of the form `{{branding.XXX}}`` are found: so, for example, a logo with a link to the organization home page can be emitted using:
```
<a
    target="_blank"
    href="{{branding.logoLink}}"
    aria-label="{{branding.customerName}}">
  <img src="{{branding.logoUrl}}">
</a>
```


## Upgrading

The master version of all four templates have been updated to use these sequences, and the master configuration file updated to provide PALCI branding that matches what was previously hardwired into the HTML templates.

To upgrade an existing installation for a customer other than PALCI, it will be necessary to replace the customised HTML templates with those supplied as part of the v1.6.0 release, and modify the top-level configuration file to include the relevant branding.

Once this has been done, upgrades to future, more functional, versions of the forms should require nothing more than a git merge from master.


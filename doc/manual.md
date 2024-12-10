# Building, configuring and running the ReShare OpenURL listener

<!-- md2toc -l 2 manual.md -->
* [Getting started](#getting-started)
    * [Downloading](#downloading)
    * [Building](#building)
    * [Running the tests](#running-the-tests)
    * [Analysing code coverage](#analysing-code-coverage)
* [Configuration](#configuration)
    * [Environment](#environment)
    * [Configuration file](#configuration-file)
        * [For general functioning:](#for-general-functioning)
        * [For communication with the ReShare back-end:](#for-communication-with-the-reshare-back-end)
        * [For preferentially sourcing the patron id from a header (eg. provided by SSO):](#for-preferentially-sourcing-the-patron-id-from-a-header-eg-provided-by-sso)
        * [For templating:](#for-templating)
        * [For multiple back ends:](#for-multiple-back-ends)
    * [Templates](#templates)
    * [Logging](#logging)
* [Starting the service](#starting-the-service)
* [Implementation of the OpenURL standard](#implementation-of-the-openurl-standard)
    * [OpenURL v0.1 and v1.0](#openurl-v01-and-v10)
    * [Service-types](#service-types)
    * [Serving static files](#serving-static-files)
    * [Confirmation](#confirmation)


## Getting started

### Downloading

The listener is not released as an NPM package: there's not much point, since nothing depends on it. So instead of installing from NPM, just get the source code:

	git clone https://github.com/openlibraryenvironment/listener-openurl

### Building

Install using NPM or Yarn, as for most Node projects:

	yarn install

### Running the tests

	yarn test

### Analysing code coverage

	yarn coverage


## Configuration

### Environment

The functioning of the OpenURL listener is affected by the following environment variables:

* `LOGGING_CATEGORIES` -- a comma-separated list of logging categories which controls what information the listener emits for logging, overriding whatever is specified by the `loggingCategories` entry in the configuration file. See [below](#logging) for details of supported logging categories.
* `LOGCAT` -- Identical to `LOGGING_CATEGORIES`.
* `LOGGING_PREFIX` -- an optional string which, if defined and non-empty, is emitted at the start of each logging line.
* `NODE_OPTIONS` affects how Node runs in the usual way: for example, `NODE_OPTIONS=--max-old-space-size=6192` allows it to allocate more memory (not that it should be needed for this small, simple program).

### Configuration file

Configuration of the OpenURL listener is primarily by means of configuration file whose name is [specified on the command-line](#starting-the-service). The file must be well-formed JSON, a single object. The following keys are recognised:

#### For general functioning:

* `loggingCategories` -- a comma-separated string such as `"start,co,rr"` specifying a default set of logging categories to be used unless [overridden with an environment variable](#environment).
* `listenPort` -- specifies which TCP/IP port to listen on, defaulting to 3012 if this is not specified.
* `checkLimit` -- boolean, when `true` an attempt will be made to see if the request does not put the patron identified by `req_id` over the request limit and to notify them of this instead of placing a request or displaying the form.
* `docRoot` -- specifies the location of a directory, relative to the location of the configuration file, from which [static files can be served](#serving-static-files).
* `digitalOnly` -- boolean indicating that pickup location should not be solicited and `deliveryMethod` should be passed to ReShare as `URL`
* `copyrightTypes` -- an array of objects with properties `code` and `name` specifying the ISO18626 copyright type codes to offer as options for that field and the display names to associate with them

#### For communication with the ReShare back-end:

* `okapiUrl` -- The full HTTP or HTTPS URL of the Okapi instance that provides the gateway to the ReShare node that the listener serves, for example `http://localhost:9130`.
* `tenant` -- The name of the tenant on that ReShare node which the resolver serves, for example `diku`.
* `username` -- The name of the user who resource-sharing requests should be posted as. This should be a user who has all the necessary permissions, but it is preferable to avoid using an administrator -- just as one does not usually run Unix services as root. A special user such as `openurl` might be created for this purpose.
* `password` -- The password needed to authenticate the specified user.

#### For preferentially sourcing the patron id from a header (eg. provided by SSO):

* `reqIdHeader` -- The HTTP header providing the patron id. Typically this will be explicitly populated by a proxy that will strip any pre-existing value.
* `reqIdToLower`, `reqIdToUpper` -- Boolean options that transform the case of the incoming id from a header.
* `reqIdRegex`, `reqIdReplacement` -- Strings to facilitate transform of the incoming id from a header, syntax following the the [Javascript replace function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace) that implements them. Example: `{ reqIdRegex: 'abc-(.*)', reqIdReplacement: '$1-b' }`

#### For templating:

These all contain the names of [template](#templates) to be used when generating the HTML to interact with the user. Templates are loaded from the `config/templates` directory.

* `template.good` -- a response when a request has been successfully posted.
* `template.bad` -- notification that a request has been unsuccessful.
* `template.form1` -- a form to fill in with request details. This is typically presented empty or nearly empty, and contains many metadata fields.
* `template.form2` -- a form to confirm a request and provide a few extra details such as pickup location.
* `template.already` -- notification that the request just submitted had already been submitted.
* `template.limit` -- notification that the request was not placed as the user is already at the configured limit for outstanding requests.
* `template.*` -- other templates, to be added as necessary.

#### For multiple back ends:

To specify several different back-ends, provide a directory under the `services` key ([example](https://github.com/openlibraryenvironment/listener-openurl/blob/a68a71b8d2feab37e3cc24ad5444396e53668c6b/config/caliban.json#L10-L36)). Within this sub-object, each key is the identifier of a service, and the corresponding value is an object with most configuration listed above. These are used when the OpenURL resolver is accessed via a baseURL whose last path component is equal to the identifier. When the resolver is accessed using a baseURL that does not match any of the configured service identifiers, it falls back to using the default service configuration (`okapiURL` etc.) specified at the top level. `loggingCategories`, `listenPort` and `docRoot` are only valid at the top-level.

If the `allowAnyDate` configuration item is set for a service, then forms that require a publication date to be entered do not insist that it consist of four digits, allowing "fuzzy" dates such as "1950s", "c1935" or "17th Century".


### Templates

The HTML pages that are returned in response to OpenURL requests are generated using [Handlebars](https://handlebarsjs.com/) templates. Each template is stored in its own file, conventionally in the `templates` subdirectory of the `config` directory. The filenames are specified as the values corresponding to `template.*` keys in [the configuration file](#configuration-file), where the part of the key after `template.` is one of a small defined set. A set of values is passed into the template, so it can include them in the generated text. These values vary by template, because each template is invoked in a different situation where different information is pertinent. However, the `good` and `bad` template are both passed the same variables:

* `status` -- the HTTP status of the Okapi-mediated response from ReShare. For successful requests this will be a 2XX code, most likely 201; for unsuccessful requests it could be anything.
* `json` -- when the body of the response received from ReShare is valid JSON, this contains the decoded structure, which can be addressed granularly, and `text` is not present.
* `text` -- when the body of the response received from ReShare is not valid JSON, this contains the raw text of the response. Exactly one of `json` and `text` is present in any given template invocation.

### Logging

The ReShare OpenURL listener uses the [`categorical-logger`](https://github.com/openlibraryenvironment/categorical-logger) library for logging. This logs messages in named categories, and emits only those that it has been told to. You can configure the set of categories that get logged by setting the `LOGGING_CATEGORIES` or `LOGCAT` environment variable (they are equivalent), which is set to a comma-separated list of category names. When neither version of this environment variable is specified, the `loggingCategories` setting in the configuration file is used. For example:

	LOGCAT=start,co,metadata node listener-openurl.js

The following category names are currently used:

* `start` -- logs a message when starting up, stating what port the listener is listening on
* `okapi` -- logs Okapi-specific operations such as authenticating a new session
* `json` -- logs the JSON returned from Okapi GET requests
* `badkey` -- logs any bad keys found during analysis of OpenURLs
* `co` -- logs the complete ContextObject created by analysis of OpenURLs
* `admindata` -- logs the admin-data section of the analysed ContextObject
* `metadata` -- logs the metadata section of the analysed ContextObject
* `rr` -- logs the ReShare request translated from the ContextObject
* `posted` -- notes whenever a new request has been successfully or unsuccessfully posted
* `error` -- logs errors such as failed posting, including HTTP response body
* `loadTemplate` -- logs the filename of each template as it is loaded. If the top-level configuration item `reloadTemplates` is set true, then this will be each time a template is accessed.

## Starting the service

You can run the service using a preselected configuration using `yarn start`, or manually using:

	node src/listener-openurl.js

By default, the listener uses the configuration file `config/openurl.json`; however, if another file is named on the command line, then that configuration is used instead:

	node src/listener-openurl.js path/to/some/other/config.json

There are no other command-line options.


## Implementation of the OpenURL standard

### OpenURL v0.1 and v1.0

Versions
[0.1](../standards/openurl-01.pdf)
and
[1.0](../standards/z39_88_2004_r2010.pdf)
of the OpenURL standard in fact describe very different specifications. The ReShare OpenURL listener supports both standards by internally transforming v0.1 OpenURLs into equivalent v1.0 OpenURLs, and directly interpreting the latter. So the v0.1 query `author=smith&title=water` is equivalent to the v1.0 query `rft.author=smith&rft.btitle=water`.

There is no very good way of determining whether a given OpenURL implements v0.1 or v1.0: the latter _may_ contain an explicit `url_ver=Z39.88-2004` key, but there is no requirement that it do so. In fact, the only formal requirement for a v1.0 OpenURLs is that it must contain a referent: which means at least one of the `rft_*` keys must be present (see table 13 in section 12.3.1 of the standard). But in practice, we need to deal with malformed OpenURLs that include inline referent metadata as `rft.*` keys but lack the `rft_val_fmt` key that is supposedly mandatory for inline referent metadata. So to pick up on all v1.0 OpenURLs, we check whether there is any `rft_*` _or_ `rft.*` key.

The listener does not support by-reference metadata: that is, it supports the various `rft.*` keys and `rft_val_fmt`, but not `rft_ref` and `rft_ref_fmt` (and likewise for the other five entities). It follows that it does not support XML-encoded context objects, since these can only be provided by reference. If you don't know what any of that means, there's no need to worry: it's doubtful whether anyone, anywhere has _ever_ provided an OpenURL v1.0 context object by reference or encoded as XML, except as a demo of their ability to do so.


### Service-types

The OpenURL listener defaults to providing the service of posting an ILL reqeust to Okapi, but it also supports the following alternative service-types, which can be specified using the `svc_id` key. (This is a standard key OpenURL 1.0; it is also supported here as a non-standard extension to OpenURL 0.1.)

* `contextObject` -- the parsed contextObject, broken down into admindata and metadata, is returned to the user in the HTTP response with content-type `application/json`.
* `reshareRequest` -- the contextObject is parsed and translated into a ReShare patron request, which is returned to the user in the HTTP response with content-type `application/json`.
* `json` -- the contextObject is transformed and the resulting patron-request posted as normal, but instead of returning an HTML  page to user it returns [a JSON-format report](openurls-for-reshare.md#special-keys).

So for example:

	$ curl 'http://localhost:3012/?id=123&svc_id=contextObject'
	{"admindata":{"rft":{"id":"123"},"svc":{"id":"contextObject"}},"metadata":{}}

This is useful mainly for testing.


### Serving static files

If a client fetches a URL whose path begins with `/static/`, the OpenURL listener will serve a static file from the `static` subdirectory of the filesystem nominated by the `docRoot` entry in the configuration file. This can be used to obtain HTML pages, stylesheets, images, etc. In particular, the HTML generated using templates may refer to stylesheets and images that are provided by the OpenURL listener.

As a special case, the URL `/favicon.ico`, which many web browsers fetch automatically, is interpreted as a request to fetch the file of that name from the root of the directory specified by the `docRoot` configuration item.

As an additional special case, the base URL of the resolver, when invoked with no arguments, is interpreted as a request to fetch the file `index.html` from the root of the directory specified by the `docRoot` configuration item.

Therefore, a typical document-root directory will contain:

* `index.html` -- explanatory text
* `favicon.ico` -- icon to be used for all generated pages
* `static` -- directory containing _all_ other accessible static files
  * Images to be included in the home page or in pages generated by the templates
  * Stylesheets to be used by these pages
  * Anything else that the administrator wants to be able to serve


### Confirmation

By default a sufficiently populated request will be directly submitted to ReShare but if a GET parameter of `confirm` is present it will always offer a confirmation form.


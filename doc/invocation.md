# Building, configuring and running the ReShare OpenURL listener

<!-- md2toc -l 2 invocation.md -->
* [Getting started](#getting-started)
    * [Downloading](#downloading)
    * [Building](#building)
    * [Running the tests](#running-the-tests)
    * [Analysing code coverage](#analysing-code-coverage)
* [Configuration](#configuration)
    * [Environment](#environment)
    * [Configuration file](#configuration-file)
    * [Templates](#templates)
    * [Logging](#logging)
* [Starting the service](#starting-the-service)
* [Implementation of the OpenURL standard](#implementation-of-the-openurl-standard)
    * [Service-types](#service-types)


## Getting started

### Downloading

The listener is not released as an NPM package: there's not much point, since nothing depends on it. So instead of installing from NPM, just get the source code:

	git clone https://github.com/openlibraryenvironment/listener-openurl

### Building

The source code is in the `src` directory, so go there and install using NPM or Yarn, as for most Node projects:

	cd src
	yarn install

### Running the tests

Also in the `src` directory:

	yarn test

### Analysing code coverage

Also in the `src` directory:

	yarn coverage


## Configuration

### Environment

The functioning of the OpenURL listener is affected by the following environment variables:

* `LOGGING_CATEGORIES` -- a comma-separated list of logging categories which controls what information the listener emits for logging. See [below](#logging) for details of supported logging categories.
* `LOGCAT` -- Identical to `LOGGING_CATEGORIES`.
* `NODE_OPTIONS` affects how Node runs in the usual way: for example, `NODE_OPTIONS=--max-old-space-size=6192` allows it to allocate more memory (not that it should be needed for this small, simple program).

### Configuration file

Configuration of the OpenURL listener is primarily by means of configuration file whose name is [specified on the command-line](#starting-the-service). The file must be well-formed JSON, a single object. The following keys are recognised:

For logging:

* `loggingCategories` -- a comma-separated string such as `"start,co,rr"` specifying a default set of logging categories to be used unless [overridden with an environment variable](#environment).

For communication with the ReShare back-end:

* `okapiUrl` -- The full HTTP URL of the Okapi instance that provides the gateway to the ReShare node that the listener serves, for example `http://localhost:9130`.
* `tenant` -- The name of the tenant on that ReShare node which the resolver serves, for example `diku`.
* `username` -- The name of the user who resource-sharing requests should be posted as. This should be a user who has all the necessary permissions, but it is preferable to avoid using an administrator -- just as one does not usually run Unix services as root. A special user such as `openurl` might be created for this purpose.
* `password` -- The password needed to authenticate the specified user.

For templating:

* `template.good` -- the name of a [template](#templates) to be used when generating the HTML for a response when a request has been successfully posted.
* `template.bad` -- the name of a template to be used when generating the HTML for a response when a request has been unsuccessful.
* `template.*` -- other templates, to be added as necessary.


### Templates

XXX

### Logging

The ReShare OpenURL listener uses the [`categorical-logger`](https://github.com/openlibraryenvironment/categorical-logger) library for logging. This logs messages in named categories, and emits only those that it has been told to. You can configure the set of categories that get logged by setting the `LOGGING_CATEGORIES` or `LOGCAT` environment variable (they are equivalent), which is set to a comma-separated list of category names. For example:

	LOGCAT=start,co,metadata node listener-openurl.js

The following category names are currently used:

* `start` -- simply logs a message when starting up
* `okapi` -- logs Okapi-specific operations such as authenticating a new session
* `badkey` -- logs any bad keys found during analysis of OpenURLs
* `co` -- logs the complete ContextObject created by analysis of OpenURLs
* `admindata` -- logs the admin-data section of the analysed ContextObject
* `metadata` -- logs the metadata section of the analysed ContextObject
* `rr` -- logs the ReShare request translated from the ContextObject
* `posted` -- notes whenever a new request has been successfully or unsuccessfully posted


## Starting the service

Also in the `src` directory. You can run the service using a preselected logging configuration using `yarn start`, or manually using:

	node listener-openurl.js

By default, the listener uses the configuration file `../config/openurl.json`; however, if another file is named on the command line, then that configuration is used instead:

	node listener-openurl.js path/to/some/other/config.json

There are no other command-line options.


## Implementation of the OpenURL standard

### OpenURL v0.1 and v1.0

Versions
[0.1](../standards/openurl-01.pdf)
and
[1.0](../standards/z39_88_2004_r2010.pdf)
of the OpenURL standard in fact describe very different specifications. The ReShare OpenURL listener supports both standards by internally transforming v0.1 OpenURLs into equivalent v1.0 OpenURLs, and directly interpreting the latter. So the v0.1 query `author=smith&title=water` is equivalent to the v1.0 query `rft.author=smith&rft.btitle=water`.

There is no very good way of determining whether a given OpenURL implements v0.1 or v1.0: the latter _may_ contain an explicit `url_ver=Z39.88-2004` key, but there is no requirement that they do so. In fact, the only formal requirement for a v1.0 OpenURLs is that it must contain a referent: which means at least one of the `rft_*` keys must be present (see table 13 in section 12.3.1 of the standard). But in practice, we need to deal with malformed OpenURLs that include inline referent metadata as `rft.*` keys but lack the `rft_val_fmt` key that is mandatory for inline referent metadata. So to pick up on all v1.0 OpenURLs, we check whether there is any `rft_*` _or_ `rft.*` key.

The listener does not support by-reference metadata: that is, it supports the various `rft.*` keys and `rft_val_fmt`, but not `rft_req` and `rft_ref_fmt` (and likewise for the other five entities). It follows that it does not support XML-encoded context objects, since these can only be provided by reference. If you don't know what any of that means, there's no need to worry: it's doubtful whether anyone, anywhere has _ever_ provided an OpenURL v1.0 context object by reference or encoded as XML, except as a demo of their ability to do so.


### Service-types

The OpenURL listener defaults to providing the service of posting an ILL reqeust to Okapi, but it also supports the following alternative service-types, which can be specified using the `svc_id` key. (This is a standard key OpenURL 1.0; it is also supported here as a non-standard extension to OpenURL 0.1.)

* `contextObject` -- the parsed contextObject, broken down into admindata and metadata, is returned to the user in the HTTP response with content-type `application/json`.

So:

	$ curl 'http://localhost:3000/?id=123&svc_id=contextObject'
	{"admindata":{"rft":{"id":"123"},"svc":{"id":"contextObject"}},"metadata":{}}

This is useful mainly for testing.



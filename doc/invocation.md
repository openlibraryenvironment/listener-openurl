# Building, configuring and running the ReShare OpenURL listener

<!-- md2toc -l 2 invocation.md -->
* [Getting started](#getting-started)
    * [Downloading](#downloading)
    * [Building](#building)
    * [Running the tests](#running-the-tests)
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


## Configuration

### Environment

XXX

### Configuration file

XXX

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

XXX argument


## Implementation of the OpenURL standard

### Service-types

The OpenURL listener defaults to providing the service of posting an ILL reqeust to Okapi, but it also supports the following alternative service-types, which can be specified using the `svc_id` key. (This is a standard key OpenURL 1.0; it is also supported here as a non-standard extension to OpenURL 0.1.)

* `contextObject` -- the parsed contextObject, broken down into admindata and metadata, is returned to the user in the HTTP response with content-type `application/json`.

So:

	$ curl 'http://localhost:3000/?id=123&svc_id=contextObject'
	{"admindata":{"rft":{"id":"123"},"svc":{"id":"contextObject"}},"metadata":{}}

This is useful mainly for testing.



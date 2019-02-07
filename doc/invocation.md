# Building and running the ReShare OpenURL listener

## Downloading

The listener is not released as an NPM package: there's not much point, since nothing depends on it. So instead of installing from NPM, just get the source code:

	git clone https://github.com/openlibraryenvironment/listener-openurl


## Building

The source code is in the `src` directory, so go there and install using NPM or Yarn, as for most Node projects:

	cd src
	yarn install

## Running the tests

Also in the `src` directory:

	yarn test

## Starting the service

Also in the `src` directory. You can run the service using a preselected logging configuration using `yarn start`, or manually using:

	node listener-openurl.js

## Logging

The ReShare OpenURL listener uses the [`categorical-logger`](https://github.com/openlibraryenvironment/categorical-logger) library for logging. This logs messages in named categories, and emits only those that it has been told to. You can configure the set of categories that get logged by setting the `LOGGING_CATEGORIES` or `LOGCAT` environment variable (they are equivalent), which is set to a comma-separated list of category names. For example:

	LOGCAT=start,co,metadata node listener-openurl.js

The following category names are currently used:

* `start` -- simply logs a message when starting up
* `badkey` -- logs any bad keys found during analysis of OpenURLs
* `co` -- logs the complete ContextObject created by analysis of OpenURLs
* `admindata` -- logs the admin-data section of the analysed ContextObject
* `metadata` -- logs the metadata section of the analysed ContextObject
* `rr` -- logs the ReShare request translated from the ContextObject


# Change history for listener-openurl

## 1.4.0 (IN PROGRESS)

* Add support for a home-page, retrieved when the baseURL is invoked with no arguments. Fixes last part of PR-135.
* Add example configuration for running as a service on a Debian GNU/Linux host: [`config/caliban.json`](config/caliban.json) is a listener configuration file tweaked or the server caliban, and [`config/listener-openurl.service`](config/listener-openurl.service) is a sample systemd unit file suitable for running on caliban.
* Expand ContextObject-to-ReshareRequest translation to handle publisher and place.
* Log POST errors using new `error` category; add this category to caliban config.
* Recognise rft.creator as another way to send author name.
* Use only the publicationTypes supported by mod-rs
* The `OpenURLServer` class now recognises `svc_id=reshareRequest`, and responds by returning the JSON of the translated request object as the response body. Used in integration testing.
* Add (a small amount of) integration-testing, invoked using `yarn integration`. Fixes PR-184.
* POSTed request now includes `requestingInstitutionSymbol`, set from path of baseURL. Fixes PR-236.
* Authenticate at `/authn/login` rather than the more heavyweight `/bl-users/login`: no change to functionality.

## [1.3.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.3.0) (2019-02-26)

* When asked to fetch a URL with a path that begins `/static/`, the named file is returned from the directory nominated by the confoguration file's `staticPath` entry. Fixes PR-135.

## [1.2.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.2.0) (2019-02-21)

* NPM package includes `listener-openurl` as a binary.

## [1.1.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.1.0) (2019-02-21)

* The port that the listener listens on is now  specified by the `listenPort` item in the  configuration file, defaulting to the old hardwired port of 3012. The `start` logging-category now states the port being used. Fixes PR-130.
* Add `.npmignore` to produce a neater, cleaner NPM package. Fixes PR-128.
* Improve test coverage.

## [1.0.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.0.0) (2019-02-20)

* First release.


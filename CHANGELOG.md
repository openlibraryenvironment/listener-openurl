# Change history for listener-openurl

## 1.6.0 (IN PROGRESS)

* When only one pickup location is available, make that the default selection on the request and confirmation forms. Fixes PR-927.
* Force all templates to be interpreted as UTF-8. (It's 2021 -- why would any piece of software ever interpret them as anything _but_ UTF-8? Oh well.) Fixes PR-993.
* If the `LOGGING_PREFIX` environment variable is set, its value is used as the logging prefix in `categorial-logger`. Fixes part of PR-1060.
* Logging of JSON structures (categories `co`, `metadata`, `admindata` and `rr`) is no longer pretty-printed, so that the structures appear all in a single line of logging. Fixes the rest of PR-1060.
* Add parameter 'rft.oclc' to pass OCLC numbers through to ReShare reqeusts.
* Upgraded to Node 18, updated dependencies
* Added digitalOnly option to support CDL
* bugfix to make svc.note optional
* Avoid internal server error for OpenURLs with no `ntries` defined. Fixes PR-1646.
* Add support for per-customer branding in the top-level configuration file. See [_Branding the OpenURL resolver for customers_](doc/branding.md). Fixes PR-1649.

## [1.5.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.5.0) (2021-05-05)

* Re-login when requests fail with HTTP status 401 as well as 403. Fixes PR-918.

## [1.4.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.4.0) (2021-05-04)

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
* Include `systemInstanceIdentifier` in ReshareRequest, derived from `rft_id`. Fixes PR-246.
* Add form for generating OpenURLs by hand. Fixes PR-269. http://openurl.indexdata.com/static/form.html
* Change `caliban.json` configuration to post requests to Index Data's ReShare node instead of K-Int's.
* When `svc_id` is `json`, post the patron request as usual but return a JSON summary instead of an HTML page. Fixes PR-461.
* When prompting for pickup location, offer a dropdown of valid values obtained from ReShare. Fixes PR-572. Available from v1.3.1.
* Consolidate OpenURL resolver configuration files. Fixes PR-681.
* Add service entries for EAST and WEST unviersities to the configuration file. Fixes PR-677.
* When a baseURL is invoked with no parameters (or insufficient to attempt a resolution), the enter-metadata form is presented. Fixes PR-651.
* Support the `rft.edition` key. This is not mentioned in the standards, but appears in some example v1.0 OpenURLs.
* Apply styles to the Request Accepted page. Fixes PR-686.
* Directory search for "pickup" is now case-insensistive, so that it works both with Millersville (which uses "Pickup") and East (which uses "pickup"). Part of PR-677.
* Request Accepted page changes. Fixes PR-688.
* Set `pickupLocationCode` rather than `pickupLocation`. Part of PR-624.
* Send `x-okapi-token` header instead of `x-token-token`. Fixes PR-781.
* Support optional `res.org` key: if supplied, the value overrides the oranization identifier in the baseURL. Fixes PR-932.
* Support optional `svc.logout` key: if supplied and true, the current authentication token is discarded. Useful only for testing.
* When an Okapi request fails with status 403 Forbidden, assume the token has expired, login again and retry the operation. Does not apply to login itself, obviously, and will only retry once. Fixes PR-918.
* May the fourth be with you!

## [1.3.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.3.0) (2019-02-26)

* When asked to fetch a URL with a path that begins `/static/`, the named file is returned from the directory nominated by the configuration file's `staticPath` entry. Fixes PR-135.

## [1.2.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.2.0) (2019-02-21)

* NPM package includes `listener-openurl` as a binary.

## [1.1.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.1.0) (2019-02-21)

* The port that the listener listens on is now  specified by the `listenPort` item in the  configuration file, defaulting to the old hardwired port of 3012. The `start` logging-category now states the port being used. Fixes PR-130.
* Add `.npmignore` to produce a neater, cleaner NPM package. Fixes PR-128.
* Improve test coverage.

## [1.0.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.0.0) (2019-02-20)

* First release.


# Change history for listener-openurl

## 1.7.0 (IN PROGRESS)

* Allow patron to select service type on the blank request form. Fixes PR-1613.
* Support new metadata fields for non-returnables. Fixes PR-1619.
* Modify available genres and their mapping to publication types. Fixes PR-1614.
* Non-functional improvements to forms, now more consistent with each other. Fixes PR-1653.
* Forms correctly render hidden values once more (This bug was introduced in commit b78ece4b and included in v1.6.0). Fixes PR-1662.
* Forms do not generate duplicate fields (and code is robust against that possibility if they somehow do). Fixes PR-1663.
* Unify CSS used by form1 and form2. Fixes PR-1654.
* Unify CSS styling between form.css and style.css. Fixes PR-1668.
* Support the "issue" field in the forms. Fixes PR-1671.
* Re-order and re-categorize request-form fields. Fixes PR-1656.
* Add `reloadTemplates` top-level config option and `loadTemplate` logging category for dynamic template loading. Fixes PR-1672.
* Redesign long form to be more space-efficient. Fixes PR-1655.
* OpenURL v0.1 detection now returns false if there is a `req.*` or `req_*` key. Fixes PR-1675.
* Completely rework CSS, to look the same but be maintainable. Done by Corina Wong. Fixes PR-1673.
* Patron can select copyright type from a list obtained from the server. Fixes PR-1643.
* Hide fields that are irrelevant to the chosen service type. Fixes PR-1657.
* Require relevant parts of the OpenURL form dependent on service/genre. Fixes PR-1679.
* If the user starts with the long form, stick with it (do not switch to short form after partial filling). Fixes PR-1686 part 3.
* Catch confirmation form up to recent changes in the long form. Fixes PR-1688.

## [1.6.0](https://github.com/openlibraryenvironment/listener-openurl/tree/v1.6.0) (2024-03-04)

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


# Patron API for ReShare

This implements an API that proxies requests through to a mod-rs instance after constraining them to a particular patron. The Okapi URL and header from which to source the patron is extracted from per-service configuration in the same format as for listener-openurl with the intent that config can be shared.

## API endpoints

### `/<service>/patronrequests`

Passes through all parameters to the `/rs/patronrequests` mod-rs URL configured for `<service>` and adds a filter for the patron id obtained from the configured header.

### `/<service>/patronrequests/<request id>/cancel`

Calls the `/rs/patronrequests/<request id>/performAction` endpoint with the `action` of `requesterCancel` and passes through the `reason` and `note` keys of the POST body as `actionParams`. 

### `/<service>/patron/validate`

Passes through all parameters to the `/rs/patron/validate` endpoint of the configured mod-rs.

### `/<service>/settings/<setting section>/<setting name>`

For allowed settings will pass through with filters on section and setting name to the `/rs/settings/appSettings` endpoint of the configured mod-rs.

## Environment variables

### `PORT`

Overrides the port in the config file.

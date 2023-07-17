# Patron API for ReShare

This implements an API that proxies requests through to a mod-rs instance after constraining them to a particular patron. The Okapi URL and header from which to source the patron is extracted from per-service configuration in the same format as for listener-openurl with the intent that config can be shared.

## API endpoints

### `/<service>/patronrequests`

Passes through all parameters to the `/rs/patronrequests` mod-rs URL configured for `<service>` and adds a filter for the patron id obtained from the configured header.

## Environment variables

### `PORT`

Overrides the port in the config file.

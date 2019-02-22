# Private notes for Mike: use at own risk

To manually mess with the underlying PostgreSQL database:

	host$ cd .../reshare/backend/mod-rs
	host$ vagrant ssh
	guest$ psql -U folio_admin -h localhost okapi_modules
	Password for user folio_admin: ***********
	psql> set search_path to diku_mod_rs, public;
	psql> select pr_id from patron_request;
	psql> delete from from patron_request;

To expose the development hosts's post 3012 on caliban:

	ssh -g -R :3012:localhost:3012 caliban

Proxying on diane means that you can then reach the development
hosts's resolver on openurl.indexdata.com port 80:

	http://openurl.indexdata.com/?rft.id=doi:10.7717/peerj.5212


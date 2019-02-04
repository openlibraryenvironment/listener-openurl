# Analysis of OpenURL example 1



## Background (from Slack)

_Wednesday, January 23rd 2019_

**Ian Ibbotson [10:34 AM]**  
Hey all! I'm working on some stories for @Chas Woodfield and I'd like to write some scenarios which contain real-world data. Chas and I have decided that it makes most sense to start with receiving a request (Because we can't test sending until we have someone to send to).
Could anyone please suggest some institutions that I can use in the scenario? I need 1 to be identified as the patron home institution - the source of the request, and 2 or 3 institutions who -in real life- might respond to that request.
In an ideal world, I'd really like it if we could yank and anonymise a real patron request.
All help gratefully received - this scenario should be end-user testable, so the more realistic the better - warts and all!

**Kurt Munson [5:48 PM]**  
@ianibbo I don't know if this is what you need. Mostly request start as an openURL string and then in existing systems we would authenticate the patron and then use a webservie to send the request via OCLC worldshare to a partner library. An example open URL from Northwestern's Primo instance is below. My university identifier (NetID, we call it here) would be sent as part of the header. That may be too far into the weeds or totally off mark of what you are asking for.
https://northwestern-illiad-oclc-org.turing.library.northwestern.edu/illiad/illiad.dll?Action=10&Form=30&rft.genre=book&rft.title=Property+and+wealth+in+classical+Sparta+%2F&rft.stitle=Property+and+wealth+in+classical+Sparta+%2F&rft.atitle=&rft.date=2000.&rft.month=&rft.volume=&rft.issue=&rft.number=&rft.epage=&rft.spage=&rft.edition=&rft.isbn=0715630407&rft.eisbn=&rft.au=,&rft.auinit=&rft.pub=Duckworth+and+the+Classical+Press+of+Wales&rft.publisher=Duckworth+and+the+Classical+Press+of+Wales&rft.place=London+%3A&rft.doi=&rfe_dat=44786349&rfr_id=info%3Asid%2Fprimo.exlibrisgroup.com-01NWU_ALMA

**Mike Taylor [5:50 PM]**  
@Kurt Munson In that OpenURL, what are `Action=10` and `Form=30`?

**Kurt Munson [6:01 PM]**  
@mike In that OpenURL, what are `Action=10` and `Form=30`? are unique to the ILLiad software. The form specifies the type of request form to populate with the data. This is a loan request.



## Analysis


### What we have

This OpenURL breaks down as
```
https://northwestern-illiad-oclc-org.turing.library.northwestern.edu/illiad/illiad.dll
	Action=10
	Form=30
	rft.genre=book
	rft.title=Property and wealth in classical Sparta /
	rft.stitle=Property and wealth in classical Sparta /
	rft.atitle=
	rft.date=2000.
	rft.month=
	rft.volume=
	rft.issue=
	rft.number=
	rft.epage=
	rft.spage=
	rft.edition=
	rft.isbn=0715630407
	rft.eisbn=
	rft.au=,
	rft.auinit=
	rft.pub=Duckworth and the Classical Press of Wales
	rft.publisher=Duckworth and the Classical Press of Wales
	rft.place=London :
	rft.doi=
	rfe_dat=44786349
	rfr_id=info:sid/primo.exlibrisgroup.com-01NWU_ALMA
```

This is a v1.0 OpenURL, recognisable from the use of `rft.` prefixes, although it lacks some potentially helpful fields such as `ctx_ver`. So we should probably focus intitial development effort of OpenURL v1.0 support

We will need to find out more about the ILLead-specific `Action` and `Form` fields.

Otherwise, we have a bunch of metadata about the sought item (the "referent" in OpenURL v1.0 terminology), each key prefixed with `rft.`, and two other fields:

* `rfr_id` -- specifies the system that generated the OpenURL. The main example given in the OpenURL v1.0 standard is `info:sid/elsevier.com:ScienceDirect`, an `info` URL in the `sid` space identifying Elsevier's _Science Direct_ platform. The value in the example, `info:sid/primo.exlibrisgroup.com-01NWU_ALMA`, is of the same form, evidently identifying Ex Libris's _Primo_ discovery system. Presumably the portion after the hyphen specifically identifies Northwestern University_'s installation. As the specification says (seciton 5.2), "Knowing the identity of the Referrer might help the Resolver to interpret the Private Data" -- in this case, the `Action` and `Form` fields.

* `rfe_dat` somehow identifies the "referring entity" -- that is, the specific work the user was looking at when they generated the OpenURL. This can be specified as `rfe_id`, which is an identifier; or as a bunch of `rfe.*` keys, which specify metadata about it. Unfortunately in this case it's an `rfe_dat`, which is "private data". There is no good way to interpret the value `44786349`, at least not without knowing more about how the referring entity (Primo in this case) generates these private values.

Fortunately, we don't really need to know anything about the referring entity: so long as we know the referer, we can look it up in a table to determine which FOLIO tenant implements its ReShare system, and we're good to go.


### What's missing

The big thing that is completely missing from this OpenURL is any information about the patron who is requesting the item. This is crucial to determine, since without it the borrowing library will not know who to circulate the borrowed item to.

There are two possible solutions.

1. OpenURL v1.0 provides means to convey information about the requester: most simply, a `req_id` field that may contain a URL such as `mailto:jane.doe@caltech.edu`; but metadata about the requested can instead be communicated using `req.*` keys; or private data using `req_dat`. Finally, reference to an external user descriptor can be provided using `req_ref` (and an accompanying `req_ref_fmt` to specify the descriptor's format).

2. If none of these can be added to the OpenURL, then it is possible that patron information might be discerned from the HTTP headers of the request that communicates the OpenURL to its resolver. The detail of these will be highly variable, depending on the discovery system and the SSO solution, so this approach should be considered an undesirable backstop.


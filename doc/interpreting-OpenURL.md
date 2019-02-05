# Interpreting the OpenURL standards in ReShare


## Introduction

One of the important methods of getting loan requests into the ReShare
system will by means of OpenURL requests. In general, we will want to
support both OpenURL v0.1 and v1.0, although we can focus our initial
development effort on whichever is used by most of our integration partners.

Given the very tight timelines for developing ReShare, we need to prioritise integration as an activity concurrent with development from the start. Our work in this area will be driven by the OpenURL standards (there are two, and they are incompatible) and by examples of real OpenURLs from our integration partners.


## The standards

* [OpenURL v0.1 specification](../standards/openurl-01.pdf) downloaded from http://alcme.oclc.org/openurl/docs/pdf/openurl-01.pdf
* [OpenURL v1.0 standard](../standards/z39_88_2004_r2010.pdf) downloaded from https://groups.niso.org/apps/group_public/download.php/14833/z39_88_2004_r2010.pdf

See also my analyses:

* [Summary of OpenURL v0.1 keys](../standards/OpenURL-v0.1-summary.txt)
* [Summary of OpenURL v1.0 keys](../standards/OpenURL-v1.0-summary.txt)

## Examples

We have the following example OpenURLs from integration partners, and
await more:

* [Example 1](../examples/example1.openurl) ([analysis](../examples/example1-analysis.md))


## Issues

In order to create and execute a loan request, we need information about three things: the institution from which the request came, the item to be requested, and the user to whom is to be delivered. OpenURLs always include information about the item, but less reliably about the other two entites. (We need to know the institution so that a multi-tenant ReShare installation can route the request to the right tenant; and the user so we know who to circulate the loaned item to.)

We will discuss the solutions to these issues in the analysis of each of the examples. since they may vary on an institution-by-instituion basis.



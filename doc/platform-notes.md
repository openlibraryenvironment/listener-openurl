# Notes on choice of software platform

In the old days, this would have been written as mod_perl code running under Apache. But times have moved on, and Perl looks increasingly ugly and circumlocutory. It's had a good run.

Instead, I chose [Node](https://nodejs.org/en/) as the implementation language as a modern, net-friendly language with a solid library ecosystem and which I'm already somewhat familiar with -- at least, more familiar than I am with Python, Go, or some of the other options.

There are various choices of web-server framework under Node, but the standard one has been [Express](https://expressjs.com/). But since I never learned that, I don't have existing knowledge that would be wasted by moving to something different. It seems that the people who made Express learned from what did and didn't work, then went away and made [Koa](https://koajs.com/), so that's what I'm going to go with.

How to interpret incoming OpenURLs? There is surprisingly little in the way of OpenURL software for Node. I found only two libraries, neither of which will be much use to us: [z3988](https://github.com/git-j/z3988) is a misnamed package that deals with embedding OpenURL 1.0 context-objects in HTML using an informal standard called [COinS](http://ocoins.info/), which never caught on and whose website seems to have gone away; and [niso-openurl](https://github.com/talis/node-niso-openurl) seems to do only the most trivial decoding, and the last of its five commits was in 2013. So we will roll out own OpenURL implementation. (I have experience of this, having written [Keystone Resolver](https://metacpan.org/release/MIRK/Keystone-Resolver-1.12) in Perl long ago.

In summary: we'll write this in **Node** using **Koa** and **rolling our own OpenURL library**.

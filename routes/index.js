var config = require('../config/config')
  , Scrape = require('./scrape').Scrape;

module.exports = exports = function(app) {
	"use strict";
	
	app.get('/',function(req,res) {
		var scrape = new Scrape();
		scrape.doSearch(merge(config.site.defaultSearchTags,config.site.alwaysExcludeTags)
				       ,"0"
				       ,function(webpage) {
			res.render('index',{'webpage':webpage});
		});
	});
	
	app.get('/search',function(req,res) {
		var scrape = new Scrape();
		var tags = [];
		var pageId = "0";
		if (req.query.tags !== undefined) {
			tags = req.query.tags.split(" ");
		}
		if (req.query.pid != undefined) {
			pageId = req.query.pid;
		}
		scrape.doSearch(merge(tags,config.site.alwaysExcludeTags)
			           ,pageId
			           ,function(webpage) {
			saveRemoteCookiesInSession(req,webpage.cookies);
			res.render('index',{'webpage':webpage});
		});
	});
	
	app.get('/image',function(req,res) {
		var scrape = new Scrape();
		var id = "0";
		if (req.query.id !== undefined) {
			id = req.query.id;
		}
		scrape.getImage(id, function(webpage) {
			saveRemoteCookiesInSession(req,webpage.cookies);
			res.render('index',{'webpage':webpage});
		});
	});
	
	app.get('/proxyImage/:fakeFileName',function(req,res) {
		var scrape = new Scrape();
		if (req.query.remoteUrl !== undefined) {
			scrape.getProxiedImage(req.query.remoteUrl,
					               req.session.remoteCookieStore,
					 			   function(headers, data) {
				res.writeHead(200,headers);
				res.send(data);
			});
		} else {
			res.writeHead(404);
			res.send();
		}
	});
}

/*
 * saveRemoteCookiesInSession
 * 
 * As distinct from the cookies we set in the user browser, we need to fake a cookie jar
 * for the cookies of the remote gallery. Storing this in session allows it to persist
 * across multiple user requests. This is necessary because loading images from the remote
 * gallery requires that you have a cookie set by the framing page, so we have to make the
 * scraper pretend that it is one set of browser requests by saving that cookie.
 */
function saveRemoteCookiesInSession(req, cookies) {
	if (!req.session.remoteCookieStore) {
		req.session.remoteCookieStore = [];
	} else {
		req.session.remoteCookieStore = [];
	}
	cookies.forEach(function(remoteCookie) {
		req.session.remoteCookieStore.push(remoteCookie);
		if (config.system.debug) {
			console.log("Saved cookie: " + remoteCookie);
		}
	});
}

function merge(a, b) {
    var hash = {}, i;
    for (i=0; i<a.length; i++) {
        hash[a[i]]=true;
    } 
    for (i=0; i<b.length; i++) {
        hash[b[i]]=true;
    } 
    return Object.keys(hash);
}
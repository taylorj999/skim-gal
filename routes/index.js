var config = require('../config/config')
  , Scrape = require('./scrape').Scrape;

module.exports = exports = function(app) {
	"use strict";
	
	app.get('/',function(req,res) {
		var scrape = new Scrape();
		scrape.doSearch(merge(config.site.defaultSearchTags,config.site.alwaysExcludeTags)
				       ,"0"
				       ,function(webpage) {
			let params = fillDefaultParameters();
			params.webpage = webpage;
			res.render('index',params);
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
			let params = fillDefaultParameters();
			params.webpage = webpage;
			if (req.query.tags!==undefined) params.tags = req.query.tags;
			saveRemoteCookiesInSession(req,webpage.cookies);
			res.render('index',params);
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
			let params = fillDefaultParameters();
			params.webpage=webpage;
			res.render('index',params);
		});
	});
	
	app.get('/proxyImage/:fakeFileName',function(req,res) {
		var scrape = new Scrape();
		if (req.query.remoteUrl !== undefined) {
			scrape.getProxiedImage(req.query.remoteUrl,
					               req.session.remoteCookieStore,
/*					 			   function(headers, data) {
				res.set({'Content-Type':headers["content-type"],'Content-Length':headers["content-length"]});
				res.status(200);
				res.send(data);
			});*/
					               function(remoteResponse) {
				if (remoteResponse.statusCode === 200) {
					res.set({'Content-Type':remoteResponse.headers["content-type"],'Content-Length':remoteResponse.headers["content-length"]});
					res.status(200);
					remoteResponse.pipe(res);
				} else {
					res.status(404);
					res.send();
				}
			});
		} else {
			res.status(404);
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

function fillDefaultParameters() {
	let defaultParams = {'error':"", 'tags':"",'pageTitle':"Gallery Scraper"};
	return defaultParams;
}
var config = require('../config/config');
var http = require("http"); var https = require("https");
var cheerio = require('cheerio');

function Scrape() {
	"use strict";
	
}

Scrape.prototype.extractResponseData = function extractResponseData(result,callback) {
	var self = this;
	var data = [];
	result.on("data", function(chunk) { data.push(chunk); });
	
	result.on("end", function() { 
		var $ = cheerio.load(data.join(""));
		var webpageTitle = $("title").text(); 
		var pageSpans = [];
		$("span.thumb").each(function(index,element) {
			var theLink = $(element).children("a").first();
			var theImage = theLink.children("img").first();
			var thumbData = {linkId : theLink.attr("id").slice(1,theLink.attr("id").length),
					         linkUrl : theLink.attr("href"),
					         imgUrl : theImage.attr("data-original"),
					         imgAlt : theImage.attr("alt"),
					         imgTitle : theImage.attr("title"),
					         encodedSrc : encodeURIComponent(theImage.attr("data-original"))};
			pageSpans.push(thumbData);
		});
		var pagination = [];
		$("div.pagination").children().each(function(index,element) {
			var tName = $(element).prop("tagName");
			var tLink = "";
			var tText = $(element).text();
			if (tName == "A") {
				tLink = $(element).attr("href");
			}
			var pagData = { pName : tName, pLink : tLink, pText : tText};
			pagination.push(pagData);
		});
		var tags = [];
		$("li.tag-type-general").each(function(index,element) {
			var tagLink = $(element).children("a").last();
			var tagActual = tagLink.text();
			var tagName = tagActual.replace(/\s/g,'_');
			var tagCount = $(element).children("span").first().text();
			var tagData = {tagName : tagName, prettyName : tagActual, tagCount : tagCount};
			tags.push(tagData);
		});
		$("li.tag-type-artist").each(function(index,element) {
			var tagLink = $(element).children("a").last();
			var tagActual = tagLink.text();
			var tagName = tagActual.replace(/\s/g,'_');
			var tagCount = $(element).children("span").first().text();
			var tagData = {tagName : tagName, prettyName : tagActual, tagCount : tagCount};
			tags.push(tagData);
		});
		$("li.tag-type-copyright").each(function(index,element) {
			var tagLink = $(element).children("a").last();
			var tagActual = tagLink.text();
			var tagName = tagActual.replace(/\s/g,'_');
			var tagCount = $(element).children("span").first().text();
			var tagData = {tagName : tagName, prettyName : tagActual, tagCount : tagCount};
			tags.push(tagData);
		});
		var image = null;
		// there should only be one of these, if there are multiples the last is the
		// real one
		$("#image").each(function(index,element) {
			image = {};
			image.width = $(element).attr("data-original-width");
			image.height = $(element).attr("data-original-height");
			image.alt = $(element).attr("alt");
			image.src = config.site.targetProtocol + "://" + config.site.targetSite + 
			            $(element).attr("src");
			image.fileName = image.src.split("/").pop();
			image.encodedSrc = encodeURIComponent($(element).attr("src"));
		});
		// comment extractor
		var comments = [];
		$("[id^=c]").each(function(index,element) {
			var idNum = $(element).attr("id").substring(1);
			if (!isNaN(parseInt(idNum, 10))) {
				if (config.system.debug) {
					console.log("Comment: " + $(element).attr("id") + " : " + $(element).text());
				}
				var commentData = {commentId: idNum, commentText: $(element).text()};
				comments.push(commentData);
			}
		});
		var setcookie = result.headers["set-cookie"];
		var cookies = [];
	    if ( setcookie ) {
	      setcookie.forEach(
	        function ( cookiestr ) {
	          cookiestr.split(";").forEach(function (indivCookie) {
	        	  cookies.push(indivCookie.trim());
	          });
	        }
	      );
	    }
        var webpage = {
          title: webpageTitle,
          spans: pageSpans,
          pagi: pagination,
          tags: tags,
          image: image,
          cookies: cookies,
          comments: comments
        }
        callback(webpage);
	});
};

Scrape.prototype.buildSearchPath = function buildSearchPath(tags, pageId) {
	var path = config.site.targetSearchUrlBase;
	path += "&tags=";
	path += tags.join('+');
	if (pageId != "0") {
		path += "&pid=";
		path += pageId;
	}
	if (config.system.debug) {
		console.log('search path:', path);
	}
	return path;
};

Scrape.prototype.doSearch = function doSearch(tags, pageId, callback) {
	var self = this;
	var options = { protocol: "https:"
				   ,hostname: config.site.targetSite 
				   ,headers:{'User-Agent':config.system.fakeUserAgent}
				   ,path:self.buildSearchPath(tags,pageId) };
	
	https.get(options, function(res) {
	  if (config.system.debug) {
		  console.log('statusCode:', res.statusCode);
		  console.log('headers:', res.headers);
	  }
		  self.extractResponseData(res,callback);
	}).on('error', (e) => {
		  console.error(e);
	});
};

Scrape.prototype.buildImagePath = function buildImagePath(id){
	var path = config.site.targetDetailUrlBase;
	path += "&id=";
	path += id;
	
	if (config.system.debug) {
		console.log('detail path: ', path);
	}
	
	return path;
};

Scrape.prototype.getImage = function getImage(id,callback) {
	var self = this;
	var options = { protocol: "https:"
		           ,hostname: config.site.targetSite
		           ,headers:{'User-Agent':config.system.fakeUserAgent}
				   ,path:self.buildImagePath(id)};
	
	https.get(options, function(res) {
	   if (config.system.debug) {
		  console.log('statusCode:', res.statusCode);
		  console.log('headers:', res.headers);
	   }
		  self.extractResponseData(res,callback);
	}).on('error', (e) => {
		  console.error(e);
	});

};

Scrape.prototype.getProxiedImage = function getProxiedImage(url, cookies, callback) {
	var self = this;
	var decodedUrl = decodeURIComponent(url);
	var options = { protocol: "https:"
				   ,hostname: config.site.targetSite
				   ,headers:{'User-Agent':config.system.fakeUserAgent}
				   ,path:decodedUrl};
	if (cookies !== undefined) {
		options.headers.cookies = cookies.join("; ");
	}
	// we can't trust that there's nothing stupid in the remote url, so do a little cleanup
	var splitUrlString = decodedUrl.split("//");
	if (splitUrlString.length > 1) {
		splitUrlString.forEach(function (urlPart) {
			if (urlPart.length === 0) {
				// ignore
			} else if (urlPart.indexOf(config.site.targetSite) != -1) {
				// do advanced cleanup
				var newHostname = "";
				var newPath = "";
				var splitUrlPart = urlPart.split("/");
				splitUrlPart.forEach(function (subUrlPart) {
					if (subUrlPart.indexOf(config.site.targetSite) != -1) {
						options.hostname = subUrlPart;
					} else {
						newPath += "/";
						newPath += subUrlPart;
					}
				});
				options.path = newPath;
			} else {
				options.path = "/" + urlPart;
			}
		});
	}
	
	if (config.system.debug) {
		console.log('request headers:', options);
	}
	https.get(options,function (res) {
		if (config.system.debug) {
		  console.log('statusCode:', res.statusCode);
		  console.log('headers:', res.headers);
		}
		  var cType = res.headers["content-type"];
		  var cLength = parseInt(res.headers["content-length"]);
		  var cIndex = 0;
		  var imgBuffer = new Buffer(cLength);
		  
		  res.setEncoding('binary');
		  res.on("data", function(chunk) {
			 imgBuffer.write(chunk,cIndex,"binary");
			 cIndex += chunk.length;
		  });
		  
		  res.on("end", function() {
			  callback(res.headers,imgBuffer);
		  });
	}).on('error', (e) => {
		  console.error(e);
	});
}

module.exports.Scrape = Scrape;
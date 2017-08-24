var config = {};

// system configuration, used to define back end features
// anything that never is required by the display layer goes in here
config.system = {};

config.system.serverPort = 3004;

//what user agent do we want the requests to look like, so we don't get blocked as a 'robot'
config.system.fakeUserAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0";

config.system.sessionKey = "your_session_secret_key_here";

config.system.debug = false;

//site configuration, used to build pages or allow/disallow actions globally
//anything that needs to be passed to the display layer goes in here
config.site = {};

config.site.targetProtocol = "https";
config.site.targetSite = "your_target_site_here.com";
config.site.targetSearchUrlBase = "/index.php?page=post&s=list";
config.site.targetDetailUrlBase = "/index.php?page=post&s=view";

config.site.defaultSearchTags = [];
config.site.alwaysExcludeTags = [];

module.exports = config;

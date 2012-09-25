var bnetClient = new BnetCompanion();

bnetClient.fetchBnetProfileData();
bnetClient.updateNews();
var t = setInterval(bnetClient.updateNews, 30000);

function BnetCompanion() {

	if ( arguments.callee._singletonInstance ) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	
	/* ============ "public" methods ================= */
	this.getNewsFeed = function() {
		return localStorage.newsFeed;
	};
	
	this.updateNews = function() {
		var news = getNews();
		
		if ( localStorage.lastPubDate ) {
			var latestPubDate = new Date(news[0].pubDate);
			var lastPubDate = new Date(localStorage.lastPubDate);
					
			if ( latestPubDate > lastPubDate ) {
				localStorage.lastPubDate = news[0].pubDate;
				chrome.browserAction.setBadgeBackgroundColor({color:[0, 150, 219, 255]});
				var token = "New";
				chrome.browserAction.setBadgeText({text:token});
			}		
		} else {
			localStorage.lastPubDate = news[0].pubDate;
		}
		
		console.log('updated news');	
	};
	
	this.setAccessToken = function(token) {
		localStorage.accessToken = token;
	}
	
	this.signedIntoTwitter = function() {
		console.log("checking if signed in: " + localStorage.accessToken);
		var signedIn = false;
		
		if ( null != localStorage.accessToken && localStorage.accessToken.length > 0 ) {
			signedIn = true;
		}
		
		return signedIn;
	};
	
	this.log = function(msg) {
		console.log(msg);
	};
	
	this.requestToken = function() {
		console.log("requesting token...");
		var callbackString = window.top.location + "?t=" + Date.now();
		var result = OAuthSimple().sign({
			action:"GET",
			method:"HMAC-SHA1",
			type:"text",
			path:"https://api.twitter.com/oauth/request_token",
			parameters:{
				oauth_version:"1.0",
				oauth_signature_method:"HMAC-SHA1",
				oauth_callback:window.top.location
			},
			signatures:{
				consumer_key:twitter.consumerKey,
				shared_secret:twitter.consumerSecret
			}
		});
		
		console.log(result.signed_url);
		
		$.ajax({
			url:result.signed_url,
			success:function(data) {
				data=data.split("&");
				for (var i in data) {
					var node = data[i].split("=");
					
					switch (node[0]) {
						case "oauth_token" : {
							localStorage.requestToken = node[1];
						} break;
						case "oauth_token_secret" : {
							localStorage.requestTokenSecret = node[1];
						} break;
						default : {
							console.log("some other data: " + node[0]);
						} break;
 					}
					
				}
				if ( localStorage.requestToken ) {
					chrome.tabs.create({
						url:"https://api.twitter.com/oauth/authorize?oauth_token=" + localStorage.requestToken
					});
				}
				
			}
		});
		
	};
	
	this.twitterSignOut = function() {
		window.localStorage.removeItem('accessToken');
		window.localStorage.removeItem('requestToken');
		window.localStorage.removeItem('requestTokenSecret');
	};
	
	this.getUserName = function() {
		return localStorage.userName;
	};
	
	this.getUserDetail = function(key) {
		return localStorage[key];
	}
	
	this.fetchBnetProfileData = function() {
		$.ajax({
			url:"http://www.bungie.net/account/profile.aspx",
			method:"GET",
			dataType:"text",
			async:false,
			success:function(response) {
				var doc = document.createElement('html');
				doc.innerHTML = response;
				
				var elem = $(doc).find('title')[0].text;
				if ( elem.indexOf("Profile") > 0 ) {
					extractUserName($(doc).find("#ctl00_mainContent_header_lblUsername"));
					
					extractAvatar($(doc).find("#ctl00_mainContent_header_imgSelectedAvatar"));
					extractBanner($(doc).find("#ctl00_mainContent_header_divContentBG"));
					extractForumRank($(doc).find("#ctl00_mainContent_header_forumPopover"));
					extractLastActive($(doc).find("#ctl00_mainContent_header_lblLastActive"));
					extractMemberSince($(doc).find("#ctl00_mainContent_lblMemberSince2"));
					extractGamerTag($(doc).find("#ctl00_mainContent_header_gtFloatLabel"));
					extractNewMessageCount($(doc).find("#ctl00_dashboardNav_loggedInNormal"));
					extractXblFriendsOnline($(doc).find("#ctl00_dashboardNav_loggedInNormal"));
				} else {
					localStorage.userName = localStorage.userName ? localStorage.userName : "Unknown"	
					localStorage.bnetAvatar = localStorage.bnetAvatar ? localStorage.bnetAvatar : "images/profile.png"
					localStorage.bnetBanner = localStorage.bnetBanner ? localStorage.bnetBanner : "http://www.bungie.net/images/Forums/UserSkins/default.jpg"
					localStorage.bnetRank = localStorage.bnetRank ? localStorage.bnetRank : "";
					localStorage.bnetLastActive = localStorage.bnetLastActive ? localStorage.bnetLastActive : "Unknown";
					localStorage.bnetMemberSince = localStorage.bnetMemberSince ? localStorage.bnetMemberSince : "Unknown";
					localStorage.gamerTag = localStorage.gamerTag ? localStorage.gamerTag : "";
					
				}		
			}
		});
	};
	
	/* ============ "private" methods ================= */
	function getNews() {
		console.log('getting news');
		var news = new Array();
		
		news = getFeedXml("http://www.bungie.net/News/NewsRss.ashx");
		
		var bungieUrl = "http";
		
		if ( localStorage.accessToken ) {
			console.log("Getting authed bungie feed");
			news = news.concat(getTwitterFeed());
		} else {
			console.log("Getting unauthed bungie feed");
			news = news.concat(getFeedXml("http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40"));
		}
				
		news = news.concat(getYoutubeFeed());	
		
		news = sortFeed(news);
		
		// only update the stored data if data is returned, so the user
		// can view the last fetched news while offline
		if ( news && news.length > 0 ) {
			localStorage.newsFeed = JSON.stringify(news);
		}
				
		return news;	
	}
	
	function getTwitterFeed() {
		var feedData = new Array();
	
		var result = OAuthSimple().sign({
			action:"GET",
			method:"HMAC-SHA1",
			dataType:"XML",
			path:"https://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40",
			parameters:{
				oauth_version:"1.0",
				oauth_signature_method:"HMAC-SHA1",
				oauth_callback:window.top.location
			},
			signatures:{
				consumer_key:twitter.consumerKey,
				shared_secret:twitter.consumerSecret,
				auth_token:localStorage.accessToken
			}
		});
		
		$.ajax({
			url:result.signed_url,
			dataType:"XML",
			method:"GET",
			async:false,
			success:function(data) {
				console.log("got something...");
				console.log(data);
				feedData = processXmlData(data);		
			}
		});
		return feedData;
	}

	function getFeedXml(feedUrl, sort) {
		var feedData = new Array();
		
		$.ajax({
			url:feedUrl,
			method:"GET",
			async:false,
			dataType:"XML",
			success:function(data) {
				console.log("got something...");
				console.log(data);
				feedData = processXmlData(data);
			}
		});
		return feedData;
	}

	function getYoutubeFeed(sort) {
		var youtubeFeed = new Array();

		$.ajax({
			url:"https://gdata.youtube.com/feeds/api/users/bungie/uploads?max-results=10",
			method:"GET",
			async:false,
			dataType:"XML",
			success:function(data) {
				$($(data).find('entry')).each(function() {
					var item = {};
					item.title = $(this).find('title').text();
					item.title = item.title.substring(0,item.title.length / 2);
					item.pubDate = $(this).find('published').text();
					
					var links = $(this).find('link');
					
					for ( i = 0; i < links.length; i++ ) {
						var tLink = $(links[i]).attr('href');
						
						if ( tLink.indexOf('watch') > -1 ) {
							item.link = tLink;
							break;
						}
						
					}
					youtubeFeed.push(item);
				});
			}
		});
		return youtubeFeed;
	}

	function sortFeed(feed) {
		feed.sort(function(a, b) {
		
			var lhsDate = new Date(a.pubDate);
			var rhsDate = new Date(b.pubDate);
			
			if ( lhsDate > rhsDate ) {
				return -1;
			}	
			if ( rhsDate > lhsDate ) {
				return 1;
			}
			return 0;
		});
		return feed;
	}	
	
	function processXmlData(data) {
		var feedData = new Array();
		console.log(data.toString());
		$($(data).find('item')).each(function() {
						
			var item = {};
			item.title = $(this).find('title').text().replace("bungie: ", "");
			item.link = $(this).find('link').text();
			item.pubDate = $(this).find('pubDate').text().replace("+0000", "GMT");
			feedData.push(item);
		});
		return feedData;
	}
	
	function extractUserName(elem) {	
		localStorage.bnetUserName = $(elem).text();
	}
	
	function extractAvatar(elem) {;
		localStorage.bnetAvatar = "http://www.bungie.net" + $(elem).attr('src');
		console.log(localStorage.bnetAvatar);
	}
	
	function extractBanner(elem) {
		var bannerUrl = $(elem).css('background-image');
		// the value is relative, so chrome tries to be smart and treat it
		// as an in-extension resource. split it and rebuild the string
		// to point to the appropriate host
		bannerUrl = bannerUrl.split("images")[1];
		bannerUrl = "http://www.bungie.net/images" + bannerUrl;
		localStorage.bnetBanner = bannerUrl.replace(")", "");
		console.log(localStorage.bnetBanner);
	}
	
	function extractForumRank(elem) {
		var ulElem = $(elem).find('ul');
		console.log(ulElem);
		$(ulElem).find('li').each(function() {
			if ( $(this).children().length == 0 ) {
				localStorage.bnetRank = $(this).text();
			}
		});
		console.log(localStorage.bnetRank );
	}
	
	function extractLastActive(elem) {
		localStorage.bnetLastActive = elem.text();
	}
	
	function extractMemberSince(elem) {
		localStorage.bnetMemberSince = elem.text();
	}
	
	function extractGamerTag(elem) {
		localStorage.gamerTag = elem.text().split(": ")[1];
		console.log(localStorage.gamerTag);
	}
	
	function extractXblFriendsOnline(elem) {
		localStorage.xblFriendsOnline = parseInt($(elem).find("li.friendsOnline").find('a').text());
	}
	
	function extractNewMessageCount(elem) {
		localStorage.bnetMessageCount = parseInt($(elem).find("li.messages").find('a').text());
	}
	
	var twitter = {};
	twitter.consumerKey = "lwCCH94saDQSOqEcuGD7w";
	twitter.consumerSecret = "Au2wXTBYyEyaDW2lv1jMDAtFj6aUhyRBxYf9h9YfA";	
}

$(document).ready(function() {
	bnetClient.log("init...");
	bnetClient.log(window.location.href);
	var d = window.location.href.split("?");
	if (d[1]) {
		d = d[1].split("&");
		for ( var i in d ) {
			var c = d[i].split("=");
			if ( c[0] == "oauth_token" ) {
				bnetClient.log("got auth token");
				bnetClient.log(c[1]);
				bnetClient.setAccessToken(c[1]);
				bnetClient.log(localStorage.accessToken);
			}
		}
		window.open('', '_self', ''); //bug fix
		window.close();
	}
});


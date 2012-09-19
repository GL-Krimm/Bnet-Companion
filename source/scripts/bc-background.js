var bnetClient = new BnetCompanion();

bnetClient.updateNews();
var t = setInterval(bnetClient.updateNews, 30000);

function BnetCompanion() {

	if ( arguments.callee._singletonInstance ) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	
	/* ============ "public" methods ================= */
	this.getNewsFeed = function() {
		return localStorage["newsFeed"];
	};
	
	this.updateNews = function() {
		var news = getNews();
		
		if ( localStorage["lastPubDate"] ) {
			var latestPubDate = new Date(news[0].pubDate);
			var lastPubDate = new Date(localStorage["lastPubDate"]);
					
			if ( latestPubDate > lastPubDate ) {
				localStorage["lastPubDate"] = news[0].pubDate;
				chrome.browserAction.setBadgeBackgroundColor({color:[0, 150, 219, 255]});
				var token = "New";
				chrome.browserAction.setBadgeText({text:token});
			}		
		} else {
			localStorage["lastPubDate"] = news[0].pubDate;
		}
		
		console.log('updated news');	
	};
	
	this.setAccessToken = function(token) {
		localStorage['access_token'] = token;
	}
	
	/* ============ "private" methods ================= */
	function getNews() {
		console.log('getting news');
		var news = new Array();
		
		news = getFeedXml("http://www.bungie.net/News/NewsRss.ashx");
		
		var bungieUrl = "http";
		
		if ( localStorage['access_token'] ) {
			news = news.concat(getTwitterFeed());
		} else {
			news = news.concat(getFeedXml("http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40"));
		}
				
		news = news.concat(getYoutubeFeed());	
		
		news = sortFeed(news);
		
		// only update the stored data if data is returned, so the user
		// can view the last fetched news while offline
		if ( news && news.length > 0 ) {
			localStorage["newsFeed"] = JSON.stringify(news);
		}
				
		return news;	
	}
	
	function getTwitterFeed() {
		var feedData = new Array();
	
		var result = OAuthSimple().sign({
			action:"GET",
			method:"HMAC-SHA1",
			type:"XML",
			path:"https://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40",
			parameters:{
				oauth_version:"1.0",
				oauth_signature_method:"HMAC-SHA1",
				oauth_callback:window.top.location
			},
			signatures:{
				consumer_key:twitter.consumerKey,
				shared_secret:twitter.consumerSecret,
				auth_token:localStorage['access_token']
			}
		});
		
		$.ajax({
			url:result.signed_url,
			success:function(data) {
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
	
	this.signedIntoTwitter = function() {
		var signedIn = false;
		
		if ( null != localStorage['access_token'] && localStorage['access_token'].length > 0 ) {
			signedIn = true;
		}
		
		return signedIn;
	};
	
	this.requestToken = function() {
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
							localStorage['request_token'] = node[1];
						} break;
						case "oauth_token_secret" : {
							localStorage['request_token_secret'] = node[1];
						} break;
						default : {
							console.log("some other data");
						} break;
 					}
					
				}
				if ( twitter.requestToken ) {
					chrome.tabs.create({
						url:"https://api.twitter.com/oauth/authorize?oauth_token=" + localStorage['request_token']
					});
				}
				
			}
		});
		
	};
	
	function processXmlData(data) {
		var feedData = new Array();
		$($(data).find('item')).each(function() {
						
			var item = {};
			item.title = $(this).find('title').text().replace("bungie: ", "");
			item.link = $(this).find('link').text();
			item.pubDate = $(this).find('pubDate').text().replace("+0000", "GMT");
			feedData.push(item);
		});
		return feedData;
	}
	
	var twitter = {};
	twitter.consumerKey = "lwCCH94saDQSOqEcuGD7w";
	twitter.consumerSecret = "Au2wXTBYyEyaDW2lv1jMDAtFj6aUhyRBxYf9h9YfA";	
}

$(document).ready(function() {
	console.log("running...");
	console.log(window.location.href);
	var d = window.location.href.split("?");
	if (d[1]) {
		d = d[1].split("&");
		for ( var i in d ) {
			var c = d[i].split("=");
			if ( c[0] == "oauth_token" ) {
				console.log(c[1]);
				bnetClient.setAccessToken(c[1]);
			}
		}
		window.close();
	}
});


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
	
	/* ============ "private" methods ================= */
	function getNews() {
		console.log('getting news');
		var news = new Array();
		
		news = getFeedXml("http://www.bungie.net/News/NewsRss.ashx");
		
		news = news.concat(getFeedXml("http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40&oauth_token=" + twitter.bKey));
		
		news = news.concat(getYoutubeFeed());	
		
		news = sortFeed(news);
		
		// only update the stored data if data is returned, so the user
		// can view the last fetched news while offline
		if ( news && news.length > 0 ) {
			localStorage["newsFeed"] = JSON.stringify(news);
		}
				
		return news;	
	}

	function getFeedXml(feedUrl, sort) {
		var feedData = new Array();
		
		$.ajax({
			url:feedUrl,
			method:"GET",
			async:false,
			dataType:"XML",
			success:function(data) {
				
				$($(data).find('item')).each(function() {
				
					var item = {};
					item.title = $(this).find('title').text().replace("bungie: ", "");
					item.link = $(this).find('link').text();
					item.pubDate = $(this).find('pubDate').text().replace("+0000", "GMT");
					feedData.push(item);
				});
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
	
	this.requestToken = function() {
		var currentDate = Date.now();
		accessor = {
			consumerSecret:twitter.consumerSecret
		};
		message = {
			action:"https://api.twitter.com/oauth/request_token",
			method:"GET",
			parameters:[
				["oauth_consumer_key",twitter.consumerKey],
				["oauth_signature_method","HMAC-SHA1"],
				["oauth_version","1.0"],
				["oauth_callback",window.top.location+"?t=" + currentDate]
			],
			success:function(response) {
				alert(response);
			}
		};
		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message,accessor);
		
		$.ajax({
			url:message.url,
			type:message.method,
			data:OAuth.getParameterMap(message.parameters),
			success:function(g,f,h) {
				console.log(g);
				console.log(f);
				console.log(JSON.stringify(h));
			}
		});
	};
	
	function twitterAuth() {
		var oauth = OAuthSimple(twitter.consumerKey,twitter.consumerSecret);
	}
	
	var settings = {};
	var twitter = {};
	twitter.consumerKey = "lwCCH94saDQSOqEcuGD7w";
	twitter.consumerSecret = "Au2wXTBYyEyaDW2lv1jMDAtFj6aUhyRBxYf9h9YfA";
	
	twitter.bKey = "180827393-dBfBsjBADfgU1nuJndS4UZBOAVsETodz3UuUc9lm";
	twitter.bSecret = "Y8Qb2wb65vmmeXr53G3r90O1UvAgXTyWvG9pzsBqPI";
	
}


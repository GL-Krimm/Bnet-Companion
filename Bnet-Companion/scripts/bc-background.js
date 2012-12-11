var bnetClient = new BnetCompanion();

bnetClient.updateNews();
var t = setInterval(bnetClient.updateNews, 30000);

setInterval(bnetClient.updateOnlineFriendsCount, 60 * 1000 * 5);


function BnetCompanion() {

	if ( arguments.callee._singletonInstance ) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	
	var bnetProfile = {};
	var settings = {};
	
	if ( localStorage.bnetProfile ) {
		bnetProfile = JSON.parse(localStorage.bnetProfile);
	} else {
		bnetProfile.signedIn = false;
	}
	
	if ( localStorage.settings ) {
		settings = JSON.parse(localStorage.settings);
	} else {
		settings.newContentFound = false;
		settings.playNotifications = true;
	}
	
	/* ============ "public" methods ================= */
	this.getNewsFeed = function() {
		return localStorage.newsFeed;
	};
	
	this.getBnetProfile = function() {
		return bnetProfile;
	};
	
	this.updateNews = function() {
		var news = getNews();
		
		if ( localStorage.lastPubDate ) {
			var latestPubDate = new Date(news[0].pubDate);
			var lastPubDate = new Date(localStorage.lastPubDate);
					
			if ( latestPubDate > lastPubDate ) {
				settings.newContentFound = true;
				settings.notificationPlayed = false;
				localStorage.lastPubDate = news[0].pubDate;
				chrome.browserAction.setBadgeBackgroundColor({color:[0, 150, 219, 255]});
				chrome.browserAction.setBadgeText({text:"New"});
			}		
			
			// play the sound notification, if enabled, once per new update detected.
			if ( ( settings.playNotifications ) && settings.newContentFound && !settings.notificationPlayed ) {
				$("#bc-notification")[0].play();
				settings.notificationPlayed = true;
			}
			
		} else {
			localStorage.lastPubDate = news[0].pubDate;
		}
		
	};
	
	this.hasNewContent = function() {
		return settings.newContentFound;
	};
	
	this.setHasNewContent = function(value) {
		settings.newContentFound = value;
	};
	
	this.setAccessToken = function(token) {
		localStorage.accessToken = token;
	};
	
	this.signedIntoTwitter = function() {
	
		var signedIn = false;
		
		if ( null != localStorage.accessToken && localStorage.accessToken.length > 0 ) {
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
		
		$.ajax({
			url:result.signed_url,
			success:function(data) {
			
				var requestToken = null;
				
				data=data.split("&");
				for (var i in data) {
					var node = data[i].split("=");
					
					if ( node[0] == "oauth_token" ) {
						requestToken = node[1];
					}
					
				}
				if ( requestToken ) {
					chrome.tabs.create({
						url:"https://api.twitter.com/oauth/authorize?oauth_token=" + requestToken
					});
				}
				
			}
		});
		
	};
	
	this.twitterSignOut = function() {
		window.localStorage.removeItem('accessToken');
	};
	
	this.bnetSignOut = function() {
		bnetProfile = {};
		bnetProfile.signedIn = false;
		localStorage.bnetProfile = JSON.stringify(bnetProfile);
	};
	
	this.fetchBnetProfileData = function() {
		$.ajax({
			url:"http://www.bungie.net/account/profile.aspx",
			type:"GET",
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
					bnetProfile.signedIn = true;
				} 		
			}
		});
		
		localStorage.bnetProfile = JSON.stringify(bnetProfile);
		return bnetProfile.signedIn;
	};
	
	this.fetchFriendsOnline = function() {
	
		var friends = [];
		bnetProfile = JSON.parse(localStorage.bnetProfile);
		
		$.ajax({
			url:"http://www.bungie.net/Stats/LiveFriends.aspx",
			type:"GET",
			dataType:"text",
			async:false,
			success:function(response) {
				var doc = document.createElement('html');
				doc.innerHTML = response;
				
				bnetProfile.numFriendsOnline = 0;
				
				$($(doc).find('.info_cont')).each(function() {
					
					var friend = {};
					
					friend.gamerTag = $.trim($(this).find('.name').text());
					friend.status = $.trim($(this).find('.game').text());
					
					if ( friend.status.toLowerCase() != 'offline' ) {
						bnetProfile.numFriendsOnline += 1;
					}
					
					friends.push(friend);
				});				
			}
		});
		localStorage.bnetProfile = JSON.stringify(bnetProfile);
		return friends;
	}	
	
	this.updateOnlineFriendsCount = function() {
		bnetProfile = JSON.parse(localStorage.bnetProfile);
		
		if ( bnetProfile.signedIn ) {
			$.ajax({
				url:"http://www.bungie.net/account/profile.aspx",
				type:"GET",
				dataType:"text",
				async:false,
				success:function(response) {
					var doc = document.createElement('html');
					doc.innerHTML = response;
					
					var elem = $(doc).find('title')[0].text;
					if ( elem.indexOf("Profile") > 0 ) {
						extractXblFriendsOnline($(doc).find("#ctl00_dashboardNav_loggedInNormal"));
					} 		
				}
			});	
		}
				
		localStorage.bnetProfile = JSON.stringify(bnetProfile);		
	};
	
	this.setPreference = function(key, val) {
		settings[key] = val;
		localStorage.settings = JSON.stringify(settings);
	};
	
	this.getPreference = function(key) {
		return settings[key];
	};
	
	/* ============ "private" methods ================= */
	
	function getNews() {
	
		var news = new Array();
		
		news = getFeedXml("http://www.bungie.net/News/NewsRss.ashx");
		
		news = news.concat(getTwitterFeed());
		
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
		var request = null;
		var twitterUrl = "http://api.twitter.com/1/statuses/user_timeline.json?user_id=26280712&count=40";
		
		if ( localStorage.accessToken ) {
			request = OAuthSimple().sign({
				action:"GET",
				method:"HMAC-SHA1",
				dataType:"JSON",
				path:"https://api.twitter.com/1/statuses/user_timeline.json?user_id=26280712&count=40",
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
		} else {
			request = {};
			request.url = twitterUrl;
			request.dataType = 'JSON';
		}
		
		$.ajax({
			url:request.signed_url || request.url,
			dataType:request.dataType, //"JSON",
			type:"GET",
			async:false,
			success:function(data) {
				for ( var i = 0; i < data.length; i++ ) {
					var item = {};
					item.pubDate = data[i].created_at;
					item.title = data[i].text;
					item.link = "http://twitter.com/bungie/statuses/" + data[i].id_str;
					
					feedData.push(item);
				}
			}
		});
		return feedData;
	}

	function getFeedXml(feedUrl, sort) {
		var feedData = new Array();
		
		$.ajax({
			url:feedUrl,
			type:"GET",
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
			type:"GET",
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
		bnetProfile.userName = $(elem).text();
	}
	
	function extractAvatar(elem) {;
		bnetProfile.avatar = "http://www.bungie.net" + $(elem).attr('src');
	}
	
	function extractBanner(elem) {
		var bannerUrl = $(elem).css('background-image');
		// the value is relative, so chrome tries to be smart and treat it
		// as an in-extension resource. split it and rebuild the string
		// to point to the appropriate host
		bannerUrl = bannerUrl.split("images")[1];
		bannerUrl = "http://www.bungie.net/images" + bannerUrl;
		bnetProfile.bannerImg = bannerUrl.replace(")", "");
	}
	
	function extractForumRank(elem) {
		var ulElem = $(elem).find('ul');
		
		$(ulElem).find('li').each(function() {
			if ( $(this).children().length == 0 ) {
				bnetProfile.bnetRank = $(this).text();
			}
		});
	}
	
	function extractLastActive(elem) {
		bnetProfile.lastActive = elem.text();
	}
	
	function extractMemberSince(elem) {
		bnetProfile.memberSince = elem.text();
	}
	
	function extractGamerTag(elem) {
		bnetProfile.gamerTag = elem.text().split(": ")[1];
	}
	
	function extractXblFriendsOnline(elem) {
		bnetProfile.numFriendsOnline = parseInt($(elem).find("li.friendsOnline").find('a').text());
	}
	
	function extractNewMessageCount(elem) {
		bnetProfile.messageCount = parseInt($(elem).find("li.messages").find('a').text());
	}
	
	var twitter = {};
	twitter.consumerKey = "lwCCH94saDQSOqEcuGD7w";
	twitter.consumerSecret = "Au2wXTBYyEyaDW2lv1jMDAtFj6aUhyRBxYf9h9YfA";	
}

$(document).ready(function() {
	
	var d = window.location.href.split("?");
	if (d[1]) {
		d = d[1].split("&");
		for ( var i in d ) {
			var c = d[i].split("=");
			if ( c[0] == "oauth_token" ) {
				localStorage.accessToken = c[1];
				bnetClient.log(localStorage.accessToken);
			}
		}
		window.open('', '_self', ''); //gets a handle on the background page when opened by omniauth callback...
		window.close(); //then closes it
	} else {
		$('body').append("<audio id='bc-notification' src='sounds/notification.mp3' type='audio/mp3'></audio>");
	}
	
});


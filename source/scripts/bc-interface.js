var bnetClient = chrome.extension.getBackgroundPage().bnetClient;

window.bcInterface = {};
bcInterface.prevPageRef = 'news';

bcInterface.debug = false;

bcInterface.mockNews = new Array();
bcInterface.mockNews.push({title:"Bungie - Your mome loves my air guitar move. IN SPACE!", pubDate:"July 19 2012", link:"http://www.bungie.net/blog.aspx?id=se7en"});
bcInterface.mockNews.push({title:"Bungie - O Brave New World", pubDate:"July 7, 2012", link:"http://www.youtube.com/watch?o-brave-new-world"});
bcInterface.mockNews.push({title:"@franklz glad to see Halo 4 is kicking ass, when will we get the beta?", pubDate:"July 7, 2007", link:"http://www.twitter.com/tweets/user/test/29rr9wrj"});
bcInterface.mockNews = JSON.stringify(bcInterface.mockNews);

bcInterface.rssUrl = "http://www.bungie.net/News/NewsRss.ashx";
bcInterface.twitterFeedUrl = "http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=20"

bcInterface.openElemRef = function(elem) {
	if ( $(elem).attr('exref') && $(elem).attr('exref').length > 0 ) {
		window.open($(elem).attr('exref'));
	} else if ( $(elem).attr('intRef') && $(elem).attr('intRef').length > 0 ) {
		
		bcInterface.renderSelectedView($(elem).attr('intRef'));
	}
};

bcInterface.renderSelectedView = function(pageId) {
	$('#bc-content').children().hide();
	$("#bc-back-more").remove();
	
	switch (pageId) {
		case "news": {
			bcInterface.renderNewsFeed( bcInterface.debug ? bcInterface.mockNews : bnetClient.getNewsFeed() );
		} break;
		case "profile": {
			bcInterface.renderProfile();
		} break;
		case "more" : {
			bcInterface.renderMorePage();
		} break;
		default:{
			$('#bc-header').prepend(span({cssClass:'bc-button', id:'bc-back-more', intRef:'more'}, "<"));
			
			$("#bc-back-more").click(function() {
				bcInterface.renderSelectedView('more');
			});
			
			$('#bc-page-title').text(pageId);
			$('#bc-content').children().hide();
			$('#bc-' + pageId).show();
		} break;
	}
	return false;
};

bcInterface.renderProfile = function() {
	$("#bc-page-title").text("Profile");
	$("#bc-forum-rank").text(bnetClient.getUserDetail("bnetRank"));
	var name = bnetClient.getUserDetail("bnetUserName");
	$("#bc-profile-img").attr('src', bnetClient.getUserDetail("bnetAvatar"));
	$("#bc-profile-name").text(name);
	console.log(bnetClient.getUserDetail("bnetBanner"));
	$("#bc-profile-banner").css("background-image", "url(" + bnetClient.getUserDetail("bnetBanner") + ")" );
	
	if ( name && name != "Unknown") {
		$("#bc-xbl-avatar").attr('src', "http://avatar.xboxlive.com/avatar/" + bnetClient.getUserDetail("gamerTag") + "/avatarpic-s.png");
	} else {
		$("#bc-xbl-avatar").attr('src', "images/profile.png");
	}
	
	$("#bc-gamertag").text(bnetClient.getUserDetail("gamerTag"));
	$("#bc-member-since").text(bnetClient.getUserDetail("bnetMemberSince"));
	
	var msgCount = bnetClient.getUserDetail("bnetMessageCount");
	if ( msgCount > 0 ) {
		$("#bc-message-count").text(msgCount).append("<strong> ></strong>");
	}
	//xblFriendsOnline
	var friendCount = bnetClient.getUserDetail("xblFriendsOnline");
	if ( friendCount > 0 ) {
		$("#bc-friend-count").text(friendCount).append("<strong> ></strong>");
	}		
	
	$("#bc-profile").show();
};

bcInterface.renderMorePage = function() {
	$("#bc-page-title").text("More");

	$("#bc-more").show();
	
/*	
	$("#bc-settings").children().remove();
	var signedIn = bnetClient.signedIntoTwitter() 
	var elemId = signedIn ? 'bc-twitter-disconnect' : 'bc-twitter-connect';
	var htmlStr = span({id:elemId, cssClass:'span-button'},
		signedIn ? "Disconnect from Twitter" : "Connect to Twitter"
	);
	
	$("#bc-settings").append(htmlStr);
	
	$("#bc-twitter-connect").click(function() {
		bnetClient.requestToken();
	});
	
	$("#bc-twitter-disconnect").click(function() {
		bnetClient.twitterSignOut();
		bcInterface.renderSettings();
	});
	
	$("#bc-settings").show();
*/
};

bcInterface.renderNewsFeed = function(newsData) {
	$("#bc-page-title").text("Bungie News");
	$('#bc-news').children().remove();
	
	newsData = JSON.parse(newsData);
	for ( var i = 0; i < newsData.length; i++ )
	{
		var title = newsData[i].title;
		var link = newsData[i].link;
		var imgStr = bcInterface.selectIcon(link); 
		
		if (title.length > 55 ) {
			title = $.trim(title).substring(0,55).split(" ").slice(0, -1).join(" ") + "...";
		}
		
		
		var htmlString = li({cssClass:'bc-news-item', exRef:link},
								img(null, imgStr) +
								p({cssClass:'bc-news-details'}, title) +
								span({cssClass:'bc-news-pub-date'}, newsData[i].pubDate)
							);
				
		$('#bc-news').append(htmlString).show();
	}
	
	// using a different class name selector here to prevent other buttons
	// from having two click handlers subscribed, thus opening a ref twice
	$('.bc-news-item').click(function() {
		bcInterface.openElemRef($(this));
	});
}

bcInterface.selectIcon = function(link) {
	var imgStr = "images/bnet.gif";
	
	if ( link.indexOf("twitter") > -1 ) {
		imgStr = "images/twitter.gif";
	} else if ( link.indexOf("youtube") > -1 ) {
		imgStr = "images/youtube.png";
	}
	return imgStr;
}

function elem(type, text, opts) {
	var elemStr = "<" + type;
	
	if ( opts ) {
		for ( var option in opts ) {
			
			elemStr += " " + option + "='" + opts[option] + "'";
			
			elemStr = elemStr.replace("cssClass", "class");
		}
	}
	
	elemStr += ">";
	
	if ( text ) {
		elemStr += text;
	}
	
	elemStr += "</" + type + ">";
	return elemStr;
}

function div(opts, text) {
	return elem("div", text, opts);
}

function ul(opts, text) {
	return elem("ul", text, opts);
}

function li(opts, text) {
	return elem("li", text, opts);
}

function span(opts, text) {
	return elem("span", text, opts);
} 

function img(opts, src){
	var options;
	
	if ( !opts ) {
		options = {};
		
	} else {
		options = opts;
	}
	options.src = src;

	return elem("img", null, options);
}

function p(text) {
	return p(null, text);
}

function p(opts, text) {
	return elem("p", text, opts);
}

function br() {
	return "</br>"
}

$(document).ready(function() {
	$('.bc-nav-item').click(function() {
		$('.bc-nav-item').removeClass('bc-nav-active');
		$(this).addClass('bc-nav-active');
		$($("#bc-footer").find('img')).each(function() {
			$(this).attr('src', $(this).attr('src').replace("-selected", ""));
		});
		$(this).find('img').attr('src', "images/" + $(this).attr('intRef') + "-selected.png");
	
		bcInterface.renderSelectedView($(this).attr('intRef'));
	});
	
	$(".bc-button").click(function() {
		console.log('got click');
		bcInterface.openElemRef($(this));
	});
	
	bcInterface.renderNewsFeed( bcInterface.debug ? bcInterface.mockNews : bnetClient.getNewsFeed() );
	
	chrome.browserAction.setBadgeText({text: ''});

});
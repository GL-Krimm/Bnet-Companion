var bnetClient = chrome.extension.getBackgroundPage().bnetClient;

window.bcInterface = {};

bcInterface.debug = false;

bcInterface.mockNews = new Array();
bcInterface.mockNews.push({title:"Bungie - Your mome loves my air guitar move. IN SPACE!", pubDate:"July 19 2012", link:"http://www.bungie.net/blog.aspx?id=se7en"});
bcInterface.mockNews.push({title:"Bungie - O Brave New World", pubDate:"July 7, 2012", link:"http://www.youtube.com/watch?o-brave-new-world"});
bcInterface.mockNews.push({title:"@franklz glad to see Halo 4 is kicking ass, when will we get the beta?", pubDate:"July 7, 2007", link:"http://www.twitter.com/tweets/user/test/29rr9wrj"});
bcInterface.mockNews = JSON.stringify(bcInterface.mockNews);

bcInterface.rssUrl = "http://www.bungie.net/News/NewsRss.ashx";
bcInterface.twitterFeedUrl = "http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=20"

bcInterface.renderSelectedView = function(pageId) {
	switch (pageId) {
		case "news": {
			bcInterface.renderNewsFeed( bcInterface.debug ? bcInterface.mockNews : bnetClient.getNewsFeed() );
		} break;
		case "profile": {
			bcInterface.renderProfile();
		} break;
		case "settings" : {
			bcInterface.renderSettings();
		} break;
		default:{
		} break;
	}
	return false;
};

bcInterface.renderProfile = function() {
	$("#bc-page-title").text("Profile: " + bnetClient.getUserDetail("bnetUserName"));
	$("#bc-forum-rank").text(bnetClient.getUserDetail("bnetRank"));
	$("#bc-profile-img").attr('src', bnetClient.getUserDetail("bnetAvatar"));
	$("#bc-profile-name").text(bnetClient.getUserDetail("bnetUserName"));
	console.log(bnetClient.getUserDetail("bnetBanner"));
	$("#bc-profile-banner").css("background-image", "url(" + bnetClient.getUserDetail("bnetBanner") + ")" );
	$("#bc-member-since").text(bnetClient.getUserDetail("bnetMemberSince"));
	$("#bc-profile").show();
};

bcInterface.renderSettings = function() {
	$("#bc-page-title").text("Settings");

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
	
	$('.bc-news-item ').click(function() {
		window.open($(this).attr('exref'));
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
		$('#bc-content').children().hide();
		bcInterface.renderSelectedView($(this).attr('intRef'));
	});
	
	bcInterface.renderNewsFeed( bcInterface.debug ? bcInterface.mockNews : bnetClient.getNewsFeed() );
	
	chrome.browserAction.setBadgeText({text: ''});

});
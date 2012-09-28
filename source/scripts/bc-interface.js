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
		case "settings" : {
			$('#bc-page-title').text($("#bc-" + pageId).attr('intName'));
			$('#bc-' + pageId).show();			
			
			if ( bnetClient.signedIntoTwitter() ) {
				$("#bc-twitter-btn").text("Disconnect from Twitter");
				
				$("#bc-twitter-btn").click(function() {
					bnetClient.twitterSignOut();
				});
			} else {
				$("#bc-twitter-btn").click(function() {
					bnetClient.requestToken();
				});
			}			
			
			$("#bc-content").append(span({cssClass:'bc-button', id:'bc-back-more'}, "< More")).show();
			
			$("#bc-back-more").click(function() {
				bcInterface.renderSelectedView('more');
			});
			
		} break;
		default:{
			$('#bc-page-title').text($("#bc-" + pageId).attr('intName'));
			$('#bc-' + pageId).show();
			
			$("#bc-content").append(span({cssClass:'bc-button', id:'bc-back-more'}, "< More")).show();
			
			$("#bc-back-more").click(function() {
				$("#bc-back-more").remove();
				bcInterface.renderSelectedView('more');
			});
						
		} break;
	}
	return false;
};

bcInterface.renderProfile = function() {
	var profile = bnetClient.getBnetProfile();
	var listId = "bc-profile-nav";
	var profileDivId = "#bc-profile";
	
	

	if ( profile.signedIn ) {
		$("#bc-page-title").text("Profile");
		var avatarImg = "http://avatar.xboxlive.com/avatar/" + profile.gamerTag + "/avatarpic-s.png";

		$(profileDivId).append(
							div({id:'bc-profile-banner'}, 
								img(null, profile.avatar) +
								br() +
								ul({id:'bc-profile-details'},
									li(null, profile.gamerTag) +
									li({cssClass:'pad-top bc-minor-detail'}, profile.bnetRank) +
									li({cssClass:'pad-top bc-minor-detail'}, "Member Since:" +
											span(null, profile.memberSince)
									)
								)
							)
						);
	
		$("#bc-profile-banner").css("background-image", "url(" + profile.bannerImg + ")" );
				
		$(profileDivId).append(
			ul({id:'bc-profile-nav', cssClass:'bc-nav-list'}, "")
		);		
		
		var avatarImg = "http://avatar.xboxlive.com/avatar/" + profile.gamerTag + "/avatarpic-s.png";
		addNavListButton(listId, 'bc-xbl-friends', avatarImg, profile.gamerTag, true, profile.numFriendsOnline);
				
		addNavListButton(listId, 'bc-bnet-messages', 'images/message.png', "Bungie Messages", true, profile.messageCount);	
		
		addNavListButton(listId, 'bc-bnet-sign-out', 'images/power.png', "Sign Out", false, null, function() {
			bnetClient.bnetSignOut();
			$(profileDivId).children().remove();
			bcInterface.renderSelectedView("profile");
		});
		
	} else {
	
		$(profileDivId).append(
			ul({id:'bc-profile-nav', cssClass:'bc-nav-list'}, "")
		);	
		
		addNavListButton('bc-profile-nav', 'bc-sign-in', 'images/power.png', 'Connect to Bnet', false, null, function() {
			bnetClient.fetchBnetProfileData();
			$(profileDivId).children().remove();
			bcInterface.renderSelectedView("profile");
		});
	}
	

	$("#bc-profile").show();
};

bcInterface.renderMorePage = function() {
	$("#bc-page-title").text("More");

	$("#bc-more").show();
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

function strong(opts, text) {
	return elem("strong", text, opts);
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

function addNavListButton(listId, buttonId, imgSrc, btnText, bottom, count, onClick ) {
	
	var countStr = count ? count + " " : ""
	var classOption = bottom ? "bottom-border" : ""
	
	var btnStr = li({id:buttonId, cssClass:classOption}, 
						img(null, imgSrc) +
						span(null, btnText) +
						span({cssClass:'right'}, 
							countStr + 
							strong(null, ">")
						)
					);
					
	$("#" + listId).append(btnStr);
	
	$("#" + buttonId).click(function() {
		onClick();
	});
	
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
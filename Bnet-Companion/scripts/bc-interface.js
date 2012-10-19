var bnetClient = chrome.extension.getBackgroundPage().bnetClient;

window.bcInterface = {};

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
	$('#bc-content').children().remove();
	
	switch (pageId) {
		case "news": {
			bcInterface.renderNewsFeed( bnetClient.getNewsFeed() );
		} break;
		case "profile": {
			bcInterface.renderProfile();
		} break;
		case "more" : {
			bcInterface.renderMorePage();
		} break;
		case "privacy" : {
			bcInterface.renderPrivacyPage();
		} break;
		case "tou" : {
			bcInterface.renderTermsOfUse();
		} break;
		case "about" : {
			bcInterface.renderAboutPage();
		} break;
		case "settings" : {		
			bcInterface.renderSettings();
		} break;
		case "friends" : {
			bcInterface.renderOnlineFriends();
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
		
	$("#bc-content").append(
		div({id:"bc-profile",style:'display:none;text-align:left;'}, "")
	);	

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
				
	}

	
	$(profileDivId).append(
		ul({id:'bc-profile-nav', cssClass:'bc-nav-list'}, "")
	);		
	
	if ( profile.signedIn ) {
	
		var avatarImg = "http://avatar.xboxlive.com/avatar/" + profile.gamerTag + "/avatarpic-s.png";
		addNavListButton(listId, 'bc-xbl-friends', avatarImg, profile.gamerTag, true, profile.numFriendsOnline, function() {
			bcInterface.renderSelectedView('friends');
		});
				
		addNavListButton(listId, 'bc-bnet-messages', 'images/message.png', "Bungie Messages", true, profile.messageCount, function() {
			window.open("http://www.bungie.net/Account/Profile.aspx?page=Messages");
		});
		
		if ( profile.messageCount > 0 ) {
			$("#bc-bnet-messages").attr('title', "Go to Messages on Bungie.net");
		}
		
		addNavListButton(listId, 'bc-bnet-sign-out', 'images/power.png', "Sign Out", false, null, function() {
			bnetClient.bnetSignOut();
			$(profileDivId).children().remove();
			bcInterface.renderSelectedView("profile");
		});
		
	} else {
	
		$("#bc-content").prepend(
			p( null, bcResources.notBnetConnectedStr)
		);
		
		addNavListButton('bc-profile-nav', 'bc-sign-in', 'images/power.png', 'Connect to Bnet', false, null, function() {
			bnetClient.fetchBnetProfileData();
			$(profileDivId).children().remove();
			bcInterface.renderSelectedView("profile");
		});
		
		$("#bc-content").append(
			br() + 
			p( null, bcResources.privacyNotice )
		);
		
	}
	

	$("#bc-profile").show();
};

bcInterface.renderMorePage = function() {
	$("#bc-page-title").text("More");
	
	$("#bc-content").append(
		div({id:'bc-more',style:'display:none;text-align:left;'}, "")
	);
	
	var listId = 'bc-more-nav';
	$("#bc-more").append(
		ul({id:listId, cssClass:'bc-nav-list'}, "")
	);
	
	addNavListButton(listId, 'bc-bungie-button', 'images/bnet.gif', 'Bungie.net Website', true, null, function() {
		window.open("http://www.bungie.net");
	});
	
	addNavListButton(listId, 'bc-privacy-policy', 'images/carnage_zone.png', 'Privacy Policy', true, null, function() {
		bcInterface.renderSelectedView('privacy');
	});

	addNavListButton(listId, 'bc-terms-of-use', 'images/banhammer.png', 'Terms of Use', true, null, function() {
		bcInterface.renderSelectedView('tou');
	});
	
	addNavListButton(listId, 'bc-about', 'images/septagon.png', 'About', true, null, function() {
		bcInterface.renderSelectedView('about');
	});	
	
	addNavListButton(listId, 'bc-settings', 'images/settings.png', 'Settings', false, null, function() {
		bcInterface.renderSelectedView('settings');
	});
	
	$("#bc-more").show();
};

bcInterface.renderNewsFeed = function(newsData) {
	$("#bc-page-title").text("Bungie News");
		
	$("#bc-content").append(
		ul({id:'bc-news',cssClass:'bc-news-list'})
	);
	
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

bcInterface.renderAboutPage = function() {
	$("#bc-title").text("About");

	addBackButton('more');
	
	$("#bc-content").append(
		div({id:'bc-about',cssClass:'scroll'})
	);
	
	$("#bc-about").append(
		p(null, bcResources.aboutAuthor)
	);
	
};

bcInterface.renderPrivacyPage = function() {
	$("#bc-page-title").text("Privacy Policy");
	
	addBackButton('more');
	
	$("#bc-content").append(
		div({id:'bc-privacy',cssClass:'scroll'})
	);
	
	$("#bc-privacy").append(
		p(null, bcResources.dataStorageNotice) +
		br()
	);
	
	$("#bc-privacy").append(
		p(null, bcResources.privacyProtectionNotice) +
		br()
	);
	
	$("#bc-privacy").append(
		p(null, bcResources.twitterNotice)
	);
};

bcInterface.renderTermsOfUse = function() {
	$("#bc-page-title").text("Privacy Policy");
	
	addBackButton('more');
	
		$("#bc-content").append(
		div({id:'bc-terms-of-use',cssClass:'scroll'})
	);
		
	$("#bc-terms-of-use").append(
		p(null, bcResources.copyRightNotice) +
		br()
	);
	
	$("#bc-terms-of-use").append(
		p(null, bcResources.licensingNotice) +
		br()
	);	
};

bcInterface.renderSettings = function() {

	$('#bc-page-title').text("Settings");

	$("#bc-content").append(
		div({id:'bc-settings',cssClass:'scroll'})
	);
	
	$("#bc-settings").append(
		p(null, bcResources.twitterConnectNotice) +
		br()
	);
	
	if ( bnetClient.signedIntoTwitter() ) {
		addSpanButton("bc-settings", 'bc-twitter-signout-btn', 'Disconnect from Twitter', function() {
			bnetClient.twitterSignOut();
			bcInterface.renderSelectedView('settings');
		});	
	} else {
		addSpanButton("bc-settings", 'bc-twitter-signin-btn', 'Connect to Twitter', function() {
			bnetClient.requestToken();
			bcInterface.renderSelectedView('settings');
		});	
	}
	
	addBackButton('more');
};

bcInterface.selectIcon = function(link) {
	var imgStr = "images/bnet.gif";
	
	if ( link.indexOf("twitter") > -1 ) {
		imgStr = "images/twitter.gif";
	} else if ( link.indexOf("youtube") > -1 ) {
		imgStr = "images/youtube.png";
	}
	return imgStr;
}

bcInterface.renderOnlineFriends = function() {
	$("#bc-page-title").text('XBL Friends');
	
	addBackButton('profile');
		
	var friends = bnetClient.fetchFriendsOnline();
	
	if ( friends.length > 0 ) {
	
		$("#bc-content").append(
			ul({id:'bc-friends-list',cssClass:'bc-news-list'})
		);
	
		for ( var i in friends ) {
			
			var avatarImg = "http://avatar.xboxlive.com/avatar/" + friends[i].gamerTag + "/avatarpic-s.png";
			var friendProfileLink = "http://www.bungie.net/Account/Profile.aspx?player=" + friends[i].gamerTag			
			
			var htmlString = li({cssClass:'bc-news-item',exref:friendProfileLink},
				img(null, avatarImg) +
				span({cssClass:'news-item-right'}, 
					strong(null, ">")
				) +
				span({cssClass:'margin-left'}, friends[i].gamerTag) +
				br() +
				span({cssClass:'bc-minor-detail margin-left'}, friends[i].status)				
			);
			
			$("#bc-friends-list").append(htmlString);
			
		}
		
		$(".bc-news-item").click(function() {
			window.open($(this).attr('exref'));
		});
	}
	
};

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

function addSpanButton(targetId, btnId, buttonText, onClick) {

	$("#" + targetId).append(
		span({id:btnId,cssClass:'span-button'}, buttonText)
	).show();
	
	$("#" + btnId).click(function() {
		onClick();
	});
}

function addBackButton(targetPage) {
	$("#bc-content").append(span({cssClass:'bc-button', id:'bc-back-more'}, "< More")).show();
	
	$("#bc-back-more").click(function() {
		bcInterface.renderSelectedView(targetPage);
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
	
	bcInterface.renderSelectedView('news');
	
	chrome.browserAction.setBadgeText({text: ''});

});
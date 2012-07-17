window.bcInterface = {};

bcInterface.rssUrl = "http://www.bungie.net/News/NewsRss.ashx";
bcInterface.twitterFeedUrl = "http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=20"

bcInterface.renderSelectedView = function(pageId) {
	switch (pageId) {
		case "news": {
			bcInterface.renderNewsFeed();
		} break;
		case "profile": {
		} break;
		default:{
		} break;
	}
	return false;
};

bcInterface.renderNewsFeed = function(newsData) {

	$('#bc-content').append("<ul id='bc-news' class='bc-news-list'></ul>");
	//var newsData = bcInterface.sortNewsFeed(data);
	newsData = JSON.parse(newsData);
	for ( var i = 0; i < newsData.length; i++ )
	{
		var title = newsData[i].title;
		
		if (title.length > 55 ) {
			title = $.trim(title).substring(0,55).split(" ").slice(0, -1).join(" ") + "...";
		}
	
		var img = (newsData[i].link.indexOf("twitter") > -1) ? "images/twitter.gif" : "images/bnet.gif";
		var htmlString = "<li class='bc-news-item' exRef='" + newsData[i].link + "'><img src='" + img + "' /><ul class='bc-news-details' ><li><span>"+ title + "</span></li>" +
						 "<li class='bc-news-pub-date'><span>" + newsData[i].pubDate + "</span</li></ul></li>";
		
		$('#bc-news').append(htmlString);	
	}
	
	$('.bc-news-item ').click(function() {
		window.open($(this).attr('exref'));
	});
}

$(document).ready(function() {
	$('.bc-nav-item').click(function() {
		$('.bc-nav-item').removeClass('bc-nav-active');
		$(this).addClass('bc-nav-active');
		$('#bc-content').children().remove();
		bcInterface.renderSelectedView($(this).attr('intRef'));
	});
	
	chrome.extension.sendMessage({method:"getnews"}, function(response) {
		bcInterface.renderNewsFeed(response.feed);
	});

});
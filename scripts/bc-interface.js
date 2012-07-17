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

bcInterface.renderNewsFeed = function(data) {

	$('#bc-content').append("<ul id='bc-news' class='bc-news-list'></ul>");
	
	var newsData = $(data).find('item');				
	
	$(newsData).each(function() {	
	
		var $item = $(this);
		
		var title = $item.find('title').text();
		var link = $item.find('link').text();
		var img = (link.indexOf("twitter") > -1) ? "images/twitter.gif" : "images/bnet.gif";
		
		var pubDate = $item.find('pubDate').text();
		
		var htmlString = "<li class='bc-news-item' exRef='" + link + "'><img src='" + img + "' /><ul class='bc-news-details' ><li><span>"+ title + "</span></li>" +
						 "<li class='bc-news-pub-date'><span>" + pubDate + "</span</li></ul></li>";
		
		$('#bc-news').append(htmlString);	
	});
	
	$('.bc-news-item ').click(function() {
		window.open($(this).attr('exref'));
	});
}

bcInterface.sortNewsFeed = function(feedData) {
	var bnetRss = feedData.rss;
	var bungieTwitter = feedData.twitter;
	
	// master array is the bnet news feed, it gets higher priority
	var newsData = $(bnetRss).find('item');
	
	// secondary array is the twitter feed, which is lower priority
	var twitterData = $(bungieTwitter).find('item');
	
	// sort the entries by date by merging elements into the master array
	// by date; for date collisions bnet posted items have higher priority
	// and go first on the list
	
	var lastMasterNode = 0;
	
	for ( i = 0; i < twitterData.length; i++ ) {
		for ( x = lastMasterNode; x < newsData.length; x++ ) {
			var bDate = new Date(newsData[x]);
			var tDate = new Date(twitterData[i]);
		} 
	}
	
};

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
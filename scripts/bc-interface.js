window.bcInterface = {};

bcInterface.rssUrl = "http://www.bungie.net/News/NewsRss.ashx";
bcInterface.twitterFeedUrl = "http://twitter.com/statuses/user_timeline/bungie.rss"

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

bcInterface.renderNewsFeed = function() {

	$.ajax({
		url: bcInterface.rssUrl,
		type:"GET",
		dataType:"XML",
		success:function(data) {
			$('#bc-content').append("<ul id='bc-news' class='bc-news-list'></ul>");
			
			var newsData = $(data).find('item');

			$.ajax({
					url: bcInterface.twitterFeedUrl,
					type:"GET",
					dataType:"XML",
					success:function(twitterData) {
						newsData = newsData.concat($(twitterData).find('item'));
					}
			});					
			
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
		
	});
	return false;
};

$(document).ready(function() {
	$('.bc-nav-item').click(function() {
		$('.bc-nav-item').removeClass('bc-nav-active');
		$(this).addClass('bc-nav-active');
		$('#bc-content').children().remove();
		bcInterface.renderSelectedView($(this).attr('intRef'));
	});
	
	//generically discover the default view then render it
	bcInterface.renderSelectedView("news");

});
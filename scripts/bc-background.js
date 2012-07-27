var newsFeed = localStorage["newsFeed"];
var fetchFreq = 30000; //30 seconds per poll

function getNewsFeed() {
	if ( null == newsFeed ) {
		newsFeed = getNews();
	}
	return newsFeed;
}
	
function getNews() {console.log("getting feed");
	var news = new Array();
	
	news = getFeedXml("http://www.bungie.net/News/NewsRss.ashx");
	
	news = news.concat(getFeedXml("http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40"));
	
	news = news.concat(getYoutubeFeed());	
	
	news = sortFeed(news);
	
	news = JSON.stringify(news);
	
	localStorage["newsFeed"] = news;
	
	return news;
}

function updateNews() {
	
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
				item.title = $(this).find('title').text();
				item.link = $(this).find('link').text();
				item.pubDate = $(this).find('pubDate').text();
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
	
		var lhsDate = new Date(a.pubDate.replace("+0000", "GMT"));
		var rhsDate = new Date(b.pubDate.replace("+0000", "GMT"));
		
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
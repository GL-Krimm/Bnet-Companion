chrome.extension.onRequest.addListener(
		function(request, sender, callback) {
			switch(request.method) {
				case "getnews" : {
					var rss = getNews();
					callback({feed: rss});
				} break;
				case "getprofile" : {
					var prof = getProfile();
					callback({profile:prof});
				} break;
				default:{
				}break;
			}
			
		}
	);
	
	function getNews() {
		var news = new Array();
		$.ajax({
			url:"http://www.bungie.net/News/NewsRss.ashx",
			method:"GET",
			async:false,
			dataType:"XML",
			success:function(data) {
					
				$($(data).find('item')).each(function() {
				
					var item = {};
					item.title = $(this).find('title').text();
					item.link = $(this).find('link').text();
					item.pubDate = $(this).find('pubDate').text();
					news.push(item);
					
				});
			}
		});
		$.ajax({
			url:"http://api.twitter.com/1/statuses/user_timeline.rss?user_id=26280712&count=40",
			method:"GET",
			async:false,
			dataType:"XML",
			success:function(data) {
				
				$($(data).find('item')).each(function() {
				
					var item = {};
					item.title = $(this).find('title').text();
					item.link = $(this).find('link').text();
					item.pubDate = $(this).find('pubDate').text();
					news.push(item);
				});
			}
		});
		
		
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
					news.push(item);
				});
			}
		});
		
		
		news.sort(function(a, b) {
		
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
		
		return JSON.stringify(news);
	}
	
	function getProfile() {
		var profUrl = "http://www.bungie.net/Account/profile.aspx?uid=9626450";
		
		var profData = {};
		
		$.ajax({
			url:profUrl,
			method:"GET",
			dataType:"html",
			async:false,
			success:function(response) {
				//profData.name
				//rank
				//since
				
				//recent messages > 
				//friends online ( xbl )
				//sign out
			}
		});
		
		return JSON.stringify(profData);		
	}
$(document).ready(function() {
	$('.bc-nav-item').click(function() {
		$('.bc-nav-item').removeClass('bc-nav-active');
		$(this).addClass('bc-nav-active');
		$('#bc-content-body').attr('src', $(this).attr('intref'));
	});
	
	$('.bc-news-list li').click(function() {
		window.open($(this).attr('exref'));
	});
});
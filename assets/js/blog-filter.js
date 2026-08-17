/* =========================================================================
   BURGENTON EQUIPMENT — BLOG CATEGORY FILTER
   =========================================================================
   Pairs with .blog-filter / .blog-filter__btn and [data-category] article
   cards on /blog/. Progressive enhancement only — every card is already
   rendered in the HTML, so the page works with JS disabled (all articles
   simply stay visible); this just toggles visibility client-side.
   ========================================================================= */

(function () {
	'use strict';

	function initBlogFilter() {
		var filter = document.querySelector('.blog-filter');
		if (!filter) return;

		var buttons = filter.querySelectorAll('.blog-filter__btn');
		var cards = document.querySelectorAll('[data-category]');

		buttons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var category = btn.getAttribute('data-filter');

				buttons.forEach(function (b) {
					b.classList.remove('is-active');
					b.setAttribute('aria-pressed', 'false');
				});
				btn.classList.add('is-active');
				btn.setAttribute('aria-pressed', 'true');

				cards.forEach(function (card) {
					var match = category === 'all' || card.getAttribute('data-category') === category;
					card.style.display = match ? '' : 'none';
				});
			});
		});
	}

	document.addEventListener('DOMContentLoaded', initBlogFilter);
})();

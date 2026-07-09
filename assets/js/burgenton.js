/* =========================================================================
   BURGENTON EQUIPMENT — GLOBAL FOUNDATION BEHAVIOR
   =========================================================================
   Vanilla JS (no jQuery dependency) for the reusable header, mobile nav,
   and scroll-to-top components defined in assets/css/burgenton.css.

   This intentionally replaces the sticky-header / off-canvas-menu logic
   in the legacy assets/js/script.js rather than extending it — script.js
   also initializes 8 Slick carousels that don't exist on any current
   page (see /docs/template-audit.md §1/§9); this file carries forward
   only the behavior that's actually used, cleanly, in vanilla JS.

   WOW.js and Odometer (loaded separately, still jQuery-plugin based) are
   left as-is per the design system — reactivating them is a markup-only
   change (add `wow`/`odometer` classes), not a script change.
   ========================================================================= */

(function () {
	'use strict';

	var STICKY_THRESHOLD = 120; // px scrolled before header goes fixed

	/* ---- Sticky header ---- */
	function initStickyHeader() {
		var header = document.getElementById('site-header');
		var spacer = document.querySelector('.header-spacer');
		if (!header) return;

		function onScroll() {
			var scrolled = window.scrollY > STICKY_THRESHOLD;
			header.classList.toggle('is-sticky', scrolled);
			if (spacer) {
				spacer.classList.toggle('is-active', scrolled);
				if (scrolled) {
					spacer.style.height = header.offsetHeight + 'px';
				}
			}
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	/* ---- Mobile off-canvas nav ---- */
	function initMobileNav() {
		var toggle = document.querySelector('.nav-toggle');
		var nav = document.querySelector('.mobile-nav');
		var overlay = document.querySelector('.mobile-nav-overlay');
		var closeBtn = document.querySelector('.mobile-nav__close');
		if (!toggle || !nav || !overlay) return;

		function open() {
			nav.classList.add('is-active');
			overlay.classList.add('is-active');
			toggle.setAttribute('aria-expanded', 'true');
			document.body.style.overflow = 'hidden';
		}

		function close() {
			nav.classList.remove('is-active');
			overlay.classList.remove('is-active');
			toggle.setAttribute('aria-expanded', 'false');
			document.body.style.overflow = '';
		}

		toggle.addEventListener('click', open);
		overlay.addEventListener('click', close);
		if (closeBtn) closeBtn.addEventListener('click', close);

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && nav.classList.contains('is-active')) close();
		});
	}

	/* ---- Mobile nav accordion (for dropdown items inside off-canvas) ---- */
	function initMobileAccordion() {
		var triggers = document.querySelectorAll('.mobile-nav__link[data-toggle="submenu"]');
		triggers.forEach(function (trigger) {
			trigger.addEventListener('click', function (e) {
				e.preventDefault();
				var submenu = trigger.nextElementSibling;
				if (!submenu) return;
				var isOpen = submenu.style.maxHeight;
				submenu.style.maxHeight = isOpen ? null : submenu.scrollHeight + 'px';
				trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
			});
		});
	}

	/* ---- Scroll-to-top ---- */
	function initScrollToTop() {
		var btn = document.querySelector('.scroll-to-top');
		if (!btn) return;

		window.addEventListener(
			'scroll',
			function () {
				btn.classList.toggle('show', window.scrollY > 300);
			},
			{ passive: true }
		);

		btn.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	/* ---- Keyboard-accessible dropdowns (desktop mega-menu) ----
	   Hover is handled in CSS; this adds Enter/Space support so the
	   dropdown also opens for keyboard users tabbing through the nav. */
	function initDropdowns() {
		var items = document.querySelectorAll('.nav-primary__item');
		items.forEach(function (item) {
			var link = item.querySelector('.nav-primary__link');
			var dropdown = item.querySelector('.nav-dropdown');
			if (!link || !dropdown) return;

			link.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					item.classList.toggle('is-open');
					dropdown.style.opacity = item.classList.contains('is-open') ? '1' : '';
					dropdown.style.visibility = item.classList.contains('is-open') ? 'visible' : '';
				}
			});
		});
	}

	/* ---- WOW.js scroll-entrance (optional — only runs if wow.js is loaded) ----
	   Reactivates the audit-confirmed-working fadeInUp pattern. Apply via
	   `class="wow fadeInUp" data-wow-delay=".2s"` in markup; no per-page
	   script needed once this foundation script is included. */
	function initWow() {
		if (typeof WOW === 'undefined') return;
		new WOW({ boxClass: 'wow', animateClass: 'animated', offset: 0, mobile: false, live: true }).init();
	}

	/* ---- Odometer count-up (optional — only runs if jQuery + the
	   odometer/appear plugins are loaded). Apply via
	   `class="odometer" data-count="1250"` on the stat value element;
	   the count animates in once it scrolls into view. */
	function initOdometer() {
		if (typeof jQuery === 'undefined' || !jQuery.fn.appear) return;
		jQuery('.odometer').appear(function () {
			jQuery('.odometer').each(function () {
				jQuery(this).text(jQuery(this).attr('data-count'));
			});
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		initStickyHeader();
		initMobileNav();
		initMobileAccordion();
		initScrollToTop();
		initDropdowns();
		initWow();
		initOdometer();
	});
})();

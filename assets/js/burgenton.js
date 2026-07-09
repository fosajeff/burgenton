/* =========================================================================
   BURGENTON EQUIPMENT — GLOBAL FOUNDATION BEHAVIOR
   =========================================================================
   Zero-dependency vanilla JS for the reusable header, mobile nav,
   scroll-reveal, and scroll-to-top components defined in
   assets/css/burgenton.css. No jQuery, no WOW.js, no animate.css.

   This intentionally replaces the sticky-header / off-canvas-menu logic
   in the legacy assets/js/script.js rather than extending it — script.js
   also initializes 8 Slick carousels that don't exist on any current
   page (see /docs/template-audit.md §1/§9); this file carries forward
   only the behavior that's actually used, cleanly, in vanilla JS.

   Performance note: this file previously loaded jQuery (108KB) + WOW.js
   (12KB) + animate.min.css (68KB) — ~188KB total — solely to toggle one
   CSS class ("animated") on scroll-into-view for a fade-up effect. The
   scroll-reveal below reproduces the same visual result (same `wow`
   `fadeInUp` `data-wow-delay` markup, zero HTML changes needed) using a
   ~20-line IntersectionObserver + CSS transition, with no dependencies.
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

	/* ---- Mobile off-canvas nav (with focus trap while open) ---- */
	function initMobileNav() {
		var toggle = document.querySelector('.nav-toggle');
		var nav = document.querySelector('.mobile-nav');
		var overlay = document.querySelector('.mobile-nav-overlay');
		var closeBtn = document.querySelector('.mobile-nav__close');
		if (!toggle || !nav || !overlay) return;

		var lastFocused = null;

		function focusableEls() {
			return Array.prototype.slice.call(
				nav.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
			);
		}

		function onKeydown(e) {
			if (e.key === 'Escape') {
				close();
				return;
			}
			if (e.key !== 'Tab') return;
			var els = focusableEls();
			if (!els.length) return;
			var first = els[0];
			var last = els[els.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}

		function open() {
			lastFocused = document.activeElement;
			nav.classList.add('is-active');
			overlay.classList.add('is-active');
			toggle.setAttribute('aria-expanded', 'true');
			document.body.style.overflow = 'hidden';
			document.addEventListener('keydown', onKeydown);
			var els = focusableEls();
			if (els.length) els[0].focus();
		}

		function close() {
			nav.classList.remove('is-active');
			overlay.classList.remove('is-active');
			toggle.setAttribute('aria-expanded', 'false');
			document.body.style.overflow = '';
			document.removeEventListener('keydown', onKeydown);
			if (lastFocused) lastFocused.focus();
		}

		toggle.addEventListener('click', open);
		overlay.addEventListener('click', close);
		if (closeBtn) closeBtn.addEventListener('click', close);
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

	/* ---- Scroll-reveal (replaces jQuery + WOW.js + animate.css) ----
	   Apply via `class="wow fadeInUp" data-wow-delay=".2s"` in markup —
	   same authoring pattern as before. Respects prefers-reduced-motion
	   via the CSS transition-duration override in burgenton.css §02. */
	function initScrollReveal() {
		var els = document.querySelectorAll('.wow');
		if (!els.length) return;

		if (!('IntersectionObserver' in window)) {
			els.forEach(function (el) { el.classList.add('animated'); });
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					var delay = entry.target.getAttribute('data-wow-delay');
					if (delay) entry.target.style.transitionDelay = delay;
					entry.target.classList.add('animated');
					observer.unobserve(entry.target);
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);

		els.forEach(function (el) { observer.observe(el); });
	}

	/* ---- Lazy video loading (assigns src only when near viewport) ----
	   Pairs with <video data-src="..." data-lazy> in markup. Keeps large
	   product-demo clips (5-8MB) out of the initial page payload. */
	function initLazyVideos() {
		var videos = document.querySelectorAll('video[data-lazy]');
		if (!videos.length) return;

		if (!('IntersectionObserver' in window)) {
			videos.forEach(loadVideo);
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					loadVideo(entry.target);
					observer.unobserve(entry.target);
				});
			},
			{ rootMargin: '200px 0px' }
		);
		videos.forEach(function (v) { observer.observe(v); });

		function loadVideo(video) {
			video.querySelectorAll('source[data-src]').forEach(function (source) {
				source.setAttribute('src', source.getAttribute('data-src'));
			});
			video.load();
			if (video.hasAttribute('data-autoplay')) video.play().catch(function () {});
		}
	}

	document.addEventListener('DOMContentLoaded', function () {
		initStickyHeader();
		initMobileNav();
		initMobileAccordion();
		initScrollToTop();
		initDropdowns();
		initScrollReveal();
		initLazyVideos();
	});
})();

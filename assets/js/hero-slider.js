/* =========================================================================
   BURGENTON EQUIPMENT — HOMEPAGE HERO SLIDER
   =========================================================================
   Crossfades between .hero-slider__slide elements. Autoplay pauses on
   hover/focus and can be stopped entirely via the pause button (WCAG
   2.2.2 — auto-updating content running longer than 5s needs a way to
   stop it). Autoplay never starts at all if the visitor has
   prefers-reduced-motion set. Loaded only on the homepage.
   ========================================================================= */

(function () {
	'use strict';

	var AUTOPLAY_MS = 6000;

	function initHeroSlider() {
		var root = document.getElementById('hero-slider');
		if (!root) return;

		var slides = root.querySelectorAll('.hero-slider__slide');
		var dots = root.querySelectorAll('[data-slide-dot]');
		var prevBtn = root.querySelector('.hero-slider__arrow--prev');
		var nextBtn = root.querySelector('.hero-slider__arrow--next');
		var pauseBtn = root.querySelector('[data-slide-pause]');
		var label = root.querySelector('[data-slide-label]');
		if (slides.length < 2) return;

		var labels = [];
		dots.forEach(function (d) {
			var full = d.getAttribute('aria-label') || '';
			labels.push(full.replace(/^Show slide \d+:\s*/, ''));
		});

		var current = 0;
		var timer = null;
		var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var playing = !reducedMotion;

		function goTo(index) {
			index = (index + slides.length) % slides.length;
			slides[current].classList.remove('is-active');
			dots[current] && dots[current].classList.remove('is-active');
			dots[current] && dots[current].setAttribute('aria-selected', 'false');

			current = index;

			slides[current].classList.add('is-active');
			dots[current] && dots[current].classList.add('is-active');
			dots[current] && dots[current].setAttribute('aria-selected', 'true');
			if (label && labels[current]) label.textContent = labels[current];
		}

		function next() { goTo(current + 1); }
		function prev() { goTo(current - 1); }

		function play() {
			if (reducedMotion) return; // never autoplay for reduced-motion visitors
			stop();
			timer = window.setInterval(next, AUTOPLAY_MS);
			playing = true;
			if (pauseBtn) {
				pauseBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
				pauseBtn.setAttribute('aria-label', 'Pause slideshow');
			}
		}

		function stop() {
			if (timer) window.clearInterval(timer);
			timer = null;
			playing = false;
			if (pauseBtn) {
				pauseBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
				pauseBtn.setAttribute('aria-label', 'Play slideshow');
			}
		}

		dots.forEach(function (dot, i) {
			dot.addEventListener('click', function () { goTo(i); stop(); });
		});
		if (nextBtn) nextBtn.addEventListener('click', function () { next(); stop(); });
		if (prevBtn) prevBtn.addEventListener('click', function () { prev(); stop(); });
		if (pauseBtn) pauseBtn.addEventListener('click', function () { playing ? stop() : play(); });

		// Pause on hover/focus so the photo a visitor is looking at doesn't
		// change under their cursor, then resume on mouseleave/blur.
		root.addEventListener('mouseenter', function () { if (playing) window.clearInterval(timer); });
		root.addEventListener('mouseleave', function () { if (playing) timer = window.setInterval(next, AUTOPLAY_MS); });
		root.addEventListener('focusin', function () { if (playing) window.clearInterval(timer); });
		root.addEventListener('focusout', function () { if (playing) timer = window.setInterval(next, AUTOPLAY_MS); });

		root.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowRight') { next(); stop(); }
			if (e.key === 'ArrowLeft') { prev(); stop(); }
		});

		if (label && labels[0]) label.textContent = labels[0];
		play();
	}

	document.addEventListener('DOMContentLoaded', initHeroSlider);
})();

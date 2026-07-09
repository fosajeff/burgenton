/* =========================================================================
   BURGENTON EQUIPMENT — FAQ ACCORDION BEHAVIOR
   =========================================================================
   Pairs with .faq / .faq-item / .faq-item__question in
   assets/css/services.css. One panel open at a time within a given
   .faq container; keyboard-operable via native <button> semantics.
   ========================================================================= */

(function () {
	'use strict';

	var uid = 0;

	function initFaqs() {
		document.querySelectorAll('.faq').forEach(function (faq, faqIndex) {
			var items = faq.querySelectorAll('.faq-item');

			items.forEach(function (item, itemIndex) {
				var question = item.querySelector('.faq-item__question');
				var answer = item.querySelector('.faq-item__answer');
				if (!question || !answer) return;

				// Programmatically associate question <-> answer for screen
				// readers (aria-controls / aria-labelledby), generated at
				// runtime so every .faq on the site gets this for free
				// without hand-adding ids to 18+ FAQ instances in markup.
				var answerId = answer.id || 'faq-answer-' + faqIndex + '-' + itemIndex + '-' + (++uid);
				answer.id = answerId;
				answer.setAttribute('role', 'region');
				question.setAttribute('aria-controls', answerId);
				answer.setAttribute('aria-labelledby', question.id || (question.id = 'faq-question-' + answerId));

				question.setAttribute('aria-expanded', 'false');

				question.addEventListener('click', function () {
					var isOpen = item.classList.contains('is-open');

					items.forEach(function (other) {
						other.classList.remove('is-open');
						var otherAnswer = other.querySelector('.faq-item__answer');
						var otherQuestion = other.querySelector('.faq-item__question');
						if (otherAnswer) otherAnswer.style.maxHeight = null;
						if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
					});

					if (!isOpen) {
						item.classList.add('is-open');
						answer.style.maxHeight = answer.scrollHeight + 'px';
						question.setAttribute('aria-expanded', 'true');
					}
				});
			});
		});
	}

	document.addEventListener('DOMContentLoaded', initFaqs);
})();

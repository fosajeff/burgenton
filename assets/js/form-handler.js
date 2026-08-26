// Sends any form with class="js-mail-form" to Web3Forms as JSON,
// instead of the default browser form POST/redirect, and reports the
// result as a toast notification.
(function () {
	var ENDPOINT = 'https://api.web3forms.com/submit';

	function serialize(form) {
		var data = {};
		var multiValueKeys = {};
		new FormData(form).forEach(function (value, key) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				multiValueKeys[key] = true;
			}
			data[key] = value;
		});
		Object.keys(multiValueKeys).forEach(function (key) {
			data[key] = new FormData(form).getAll(key).join(', ');
		});
		return data;
	}

	function injectToastStyles() {
		if (document.getElementById('js-mail-toast-styles')) return;
		var style = document.createElement('style');
		style.id = 'js-mail-toast-styles';
		style.textContent =
			'.js-mail-toast-container{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px;pointer-events:none;}' +
			'.js-mail-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:var(--radius-md,6px);background:var(--surface-page,#fff);box-shadow:var(--shadow-lg,0 20px 48px rgba(4,4,4,.18));font-size:var(--text-body-sm,0.875rem);line-height:1.4;border-left:4px solid;opacity:0;transform:translateX(16px);transition:opacity .25s ease,transform .25s ease;pointer-events:auto;}' +
			'.js-mail-toast.is-visible{opacity:1;transform:translateX(0);}' +
			'.js-mail-toast--success{border-left-color:var(--color-success,#1e8e3e);}' +
			'.js-mail-toast--error{border-left-color:var(--color-error,#b50707);}' +
			'.js-mail-toast__message{flex:1;color:var(--text-body,#040404);}' +
			'.js-mail-toast__close{background:none;border:0;cursor:pointer;font-size:1rem;line-height:1;color:inherit;opacity:.5;padding:0;margin-left:4px;}' +
			'.js-mail-toast__close:hover{opacity:1;}' +
			'@media (max-width:480px){.js-mail-toast-container{left:16px;right:16px;max-width:none;}}';
		document.head.appendChild(style);
	}

	function getToastContainer() {
		var container = document.querySelector('.js-mail-toast-container');
		if (!container) {
			container = document.createElement('div');
			container.className = 'js-mail-toast-container';
			container.setAttribute('aria-live', 'polite');
			container.setAttribute('aria-atomic', 'true');
			document.body.appendChild(container);
		}
		return container;
	}

	function showToast(message, isError) {
		injectToastStyles();
		var container = getToastContainer();

		var toast = document.createElement('div');
		toast.className = 'js-mail-toast js-mail-toast--' + (isError ? 'error' : 'success');

		var text = document.createElement('span');
		text.className = 'js-mail-toast__message';
		text.textContent = message;
		toast.appendChild(text);

		var closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'js-mail-toast__close';
		closeBtn.setAttribute('aria-label', 'Dismiss');
		closeBtn.innerHTML = '&times;';
		toast.appendChild(closeBtn);

		container.appendChild(toast);
		requestAnimationFrame(function () {
			toast.classList.add('is-visible');
		});

		var dismissTimer = setTimeout(dismiss, 6000);

		function dismiss() {
			clearTimeout(dismissTimer);
			toast.classList.remove('is-visible');
			setTimeout(function () {
				if (toast.parentNode) toast.parentNode.removeChild(toast);
			}, 250);
		}

		closeBtn.addEventListener('click', dismiss);
	}

	document.addEventListener('submit', function (event) {
		var form = event.target;
		if (!form.classList || !form.classList.contains('js-mail-form')) return;
		event.preventDefault();

		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		if (form.querySelector('.h-captcha')) {
			var captchaResponse = form.querySelector('[name="h-captcha-response"]');
			if (!captchaResponse || !captchaResponse.value) {
				showToast('Please complete the captcha verification before submitting.', true);
				return;
			}
		}

		var button = form.querySelector('button[type="submit"]');
		var originalButtonHtml = button ? button.innerHTML : null;
		if (button) {
			button.disabled = true;
			button.innerHTML = 'Sending&hellip;';
		}

		fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(serialize(form)),
		})
			.then(function (res) {
				return res
					.json()
					.catch(function () {
						return {};
					})
					.then(function (body) {
						return { ok: res.ok && body.success === true, body: body };
					});
			})
			.then(function (result) {
				if (result.ok) {
					form.reset();
					showToast('Thank you — your submission has been received. Our team will be in touch shortly.', false);
				} else {
					showToast('Something went wrong sending your message. Please email info@burgenton.com directly.', true);
				}
			})
			.catch(function () {
				showToast('Something went wrong sending your message. Please email info@burgenton.com directly.', true);
			})
			.finally(function () {
				if (button) {
					button.disabled = false;
					button.innerHTML = originalButtonHtml;
				}
			});
	});
})();

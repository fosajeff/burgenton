// Sends any form with class="js-mail-form" to the Burgenton mail worker
// as JSON, instead of the default browser form POST.
(function () {
	// TODO: replace with the deployed worker URL, e.g.
	// "https://burgenton-mail.<your-subdomain>.workers.dev/submit"
	var ENDPOINT = 'https://burgenton-mail.YOUR-SUBDOMAIN.workers.dev/submit';

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
			data[key] = new FormData(form).getAll(key);
		});
		return data;
	}

	function setStatus(form, message, isError) {
		var status = form.querySelector('.js-mail-form-status');
		if (!status) {
			status = document.createElement('p');
			status.className = 'js-mail-form-status text-sm';
			status.style.marginTop = 'var(--space-3, 12px)';
			form.appendChild(status);
		}
		status.textContent = message;
		status.style.color = isError ? '#c0392b' : '#2e7d32';
	}

	document.addEventListener('submit', function (event) {
		var form = event.target;
		if (!form.classList || !form.classList.contains('js-mail-form')) return;
		event.preventDefault();

		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		var button = form.querySelector('button[type="submit"]');
		var originalButtonHtml = button ? button.innerHTML : null;
		if (button) {
			button.disabled = true;
			button.innerHTML = 'Sending&hellip;';
		}

		fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(serialize(form)),
		})
			.then(function (res) {
				return res
					.json()
					.catch(function () {
						return {};
					})
					.then(function (body) {
						return { ok: res.ok && body.ok, body: body };
					});
			})
			.then(function (result) {
				if (result.ok) {
					form.reset();
					setStatus(form, 'Thank you — your submission has been received. Our team will be in touch shortly.', false);
				} else {
					setStatus(form, 'Something went wrong sending your message. Please email info@burgenton.com directly.', true);
				}
			})
			.catch(function () {
				setStatus(form, 'Something went wrong sending your message. Please email info@burgenton.com directly.', true);
			})
			.finally(function () {
				if (button) {
					button.disabled = false;
					button.innerHTML = originalButtonHtml;
				}
			});
	});
})();

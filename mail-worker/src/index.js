// Burgenton website form-submission handler.
// Receives JSON POSTs from the site's forms and relays them as email via Resend.

const FORM_CONFIG = {
	quote_enquiry: { recipientVar: 'SALES_EMAIL', label: 'Website Enquiry — Quote / Product' },
	dealer_application: { recipientVar: 'INFO_EMAIL', label: 'Website Enquiry — Dealer Application' },
	distributor_application: { recipientVar: 'INFO_EMAIL', label: 'Website Enquiry — Distributor Application' },
	service_partner_application: { recipientVar: 'INFO_EMAIL', label: 'Website Enquiry — Service Partner Application' },
	newsletter_signup: { recipientVar: 'INFO_EMAIL', label: 'Website Enquiry — Newsletter Signup' },
};

export default {
	async fetch(request, env) {
		const origin = request.headers.get('Origin') || '';
		const headers = corsHeaders(origin, env);

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers });
		}

		const url = new URL(request.url);
		if (request.method !== 'POST' || url.pathname !== '/submit') {
			return json({ ok: false, error: 'Not found' }, 404, headers);
		}

		let data;
		try {
			data = await request.json();
		} catch {
			return json({ ok: false, error: 'Invalid JSON body' }, 400, headers);
		}

		// Honeypot: bots fill every field, humans never see this one. Pretend success.
		if (data.hp_website) {
			return json({ ok: true }, 200, headers);
		}

		const config = FORM_CONFIG[data.form_type];
		if (!config) {
			return json({ ok: false, error: 'Unknown or missing form_type' }, 400, headers);
		}

		if (typeof data.email !== 'string' || !data.email.includes('@')) {
			return json({ ok: false, error: 'A valid email address is required' }, 400, headers);
		}

		const to = env[config.recipientVar];
		if (!to) {
			return json({ ok: false, error: 'Recipient not configured' }, 500, headers);
		}

		const rows = Object.entries(data)
			.filter(([key]) => key !== 'form_type' && key !== 'hp_website')
			.map(
				([key, value]) =>
					`<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(
						labelize(key)
					)}</td><td style="padding:4px 0;">${escapeHtml(
						Array.isArray(value) ? value.join(', ') : String(value || '—')
					)}</td></tr>`
			)
			.join('');

		const html = `<h2 style="margin:0 0 16px;">${escapeHtml(config.label)}</h2><table cellpadding="0" cellspacing="0" style="font-family:sans-serif;font-size:14px;">${rows}</table><p style="color:#888;font-size:12px;margin-top:16px;">Submitted from the Burgenton website.</p>`;

		const subjectSuffix = data.name || data.company;
		const subject = `${config.label}${subjectSuffix ? ` — ${subjectSuffix}` : ''}`;

		const resendResponse = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: env.FROM_EMAIL,
				to: [to],
				reply_to: data.email,
				subject,
				html,
			}),
		});

		if (!resendResponse.ok) {
			return json({ ok: false, error: 'Email send failed' }, 502, headers);
		}

		return json({ ok: true }, 200, headers);
	},
};

function corsHeaders(origin, env) {
	const allowed = (env.ALLOWED_ORIGINS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
	return {
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		Vary: 'Origin',
	};
}

function json(obj, status, headers) {
	return new Response(JSON.stringify(obj), {
		status,
		headers: { ...headers, 'Content-Type': 'application/json' },
	});
}

function labelize(key) {
	return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str) {
	return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

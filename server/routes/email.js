const emailjs = require('@emailjs/nodejs');

const sendEmail = async (templateId, templateParams) => {
	return emailjs.send(
		process.env.EMAILJS_SERVICE_ID,
		templateId,
		templateParams,
		{
			publicKey: process.env.EMAILJS_PUBLIC_KEY,
			privateKey: process.env.EMAILJS_PRIVATE_KEY,
		}
	);
};

async function sendValidationEmail(user, origin) {
	const baseUrl = process.env.BASE_URL || origin || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:5173';
	const confirmationUrl = `${baseUrl}/confirm-email/${user.token}`;

	const templateParams = {
		name: user.firstName || 'there',
		confirmationUrl: confirmationUrl,
		email: user.email
	};

	try {
		await sendEmail("template_rblww43", templateParams);
	} catch (error) {
		console.error('Email Delivery Failed:', JSON.stringify(error, null, 2));

		// This sends the actual error message back to your frontend
		const errorMessage = error.text || error.message || JSON.stringify(error);
		throw(`Error sending validation email: ${errorMessage}`);
	}
};

async function sendConfirmedEmail(user, origin) {
	const baseUrl = process.env.BASE_URL || origin || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:5173';
	const loginUrl = `${baseUrl}/`;

	const templateParams = {
		name: user.firstName || 'there',
		confirmationUrl: loginUrl,
		email: user.email
	};

	try {
		await sendEmail("template_p04a9jw", templateParams);
	} catch (error) {
		console.error('EmailJS Confirmation Error:', error);
		throw error;
	}
};

module.exports = { sendValidationEmail, sendConfirmedEmail };
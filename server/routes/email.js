const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prefer IPv4 over IPv6 for railway
if (dns.setDefaultResultOrder) {
	dns.setDefaultResultOrder('ipv4first');
}


const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true, // Use SSL/TLS
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS?.replace(/\s/g, '') // Remove spaces if present
	},
	connectionTimeout: 10000, // 10 seconds
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
	if (error) {
		console.error('❌ Email transporter error:', error);
	} else {
		console.log('✅ Email transporter verified and ready to send');
	}
});

async function sendValidationEmail(transporter, user) {
	const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/confirm-email/${user.token}`;

	const mailOptions = {
		from: process.env.EMAIL_FROM || '"Hirsch Guitar Academy" <noreply@hirschguitaracademy.com>',
		to: user.email,
		subject: 'Confirm your Hirsch Guitar Academy account',
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					.container { font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
					.header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
					.content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; }
					.button { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4); }
					.footer { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
					h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.025em; }
					p { line-height: 1.6; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>Welcome to Hirsch Guitar Academy!</h1>
					</div>
					<div class="content">
						<p>Hi ${user.firstName || 'there'},</p>
						<p>We're excited to have you join our community! To get started, please confirm your email address by clicking the button below:</p>
						<div style="text-align: center;">
							<a href="${confirmationUrl}" class="button">Confirm Email Address</a>
						</div>
						<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
						<p style="word-break: break-all; color: #3b82f6;">${confirmationUrl}</p>
						<p>If you didn't create an account, you can safely ignore this email.</p>
					</div>
					<div class="footer">
						&copy; 2024 Hirsch Guitar Academy. All rights reserved.
					</div>
				</div>
			</body>
			</html>
		`,
	};
	await transporter.sendMail(mailOptions);
};

async function sendConfirmedEmail(transporter, user) {
	const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/`;
	const mailOptions = {
		from: process.env.EMAIL_FROM || '"Hirsch Guitar Academy" <noreply@hirschguitaracademy.com>',
		to: user.email,
		subject: 'Your Hirsch Guitar Academy account has been confirmed',
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					.container { font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
					.header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
					.content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; }
					.button { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4); }
					.footer { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
					h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.025em; }
					p { line-height: 1.6; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>Welcome to Hirsch Guitar Academy!</h1>
					</div>
					<div class="content">
						<p>Hi ${user.firstName || 'there'},</p>
						<p>We're excited to have you join our community!</p>
						<div style="text-align: center;">
							<a href="${confirmationUrl}" class="button">Login</a>
						</div>
						<p>If you didn't create an account, please contact us at unknown email.</p>
					</div>
					<div class="footer">
						&copy; 2024 Hirsch Guitar Academy. All rights reserved.
					</div>
				</div>
			</body>
			</html>
		`,
	};
	await transporter.sendMail(mailOptions);
};

module.exports = {transporter, sendValidationEmail, sendConfirmedEmail};
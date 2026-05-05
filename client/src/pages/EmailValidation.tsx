import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';

const EmailValidation = () => {
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('');
	const { token } = useParams<{ token: string }>();

	useEffect(() => {
		const validateEmail = async () => {
			if (!token) {
				setStatus('error');
				setMessage('Invalid or missing confirmation token.');
				return;
			}

			try {
				const response = await api.post('/validate', { token });
				if (response.data.success) {
					setStatus('success');
					setMessage(response.data.message || 'Email confirmed successfully!');
				} else {
					setStatus('error');
					setMessage(response.data.message || 'Failed to confirm email.');
				}
			} catch (error: any) {
				console.error('Validation error:', error);
				setStatus('error');
				setMessage(error.response?.data?.message || 'An error occurred during validation.');
			}
		};

		validateEmail();
	}, [token]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 font-sans">
			<div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-xl border border-white/20">
				{/* Decorative background glow */}
				<div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
				<div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

				<div className="relative z-10 flex flex-col items-center text-center">
					<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-inner">
						{status === 'loading' && (
							<div className="animate-spin text-blue-400">
								<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
							</div>
						)}
						{status === 'success' && (
							<div className="text-emerald-400">
								<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
						)}
						{status === 'error' && (
							<div className="text-rose-400">
								<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
						)}
					</div>

					<h1 className="mb-3 text-3xl font-bold tracking-tight text-white">
						{status === 'loading' ? 'Validating...' :
							status === 'success' ? 'Email Verified' : 'Validation Failed'}
					</h1>

					<p className="mb-8 text-lg text-slate-300 leading-relaxed">
						{message}
					</p>

					<Link
						to="/"
						className={`group relative flex w-full items-center justify-center overflow-hidden rounded-lg px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${status === 'loading' ? 'bg-slate-700 pointer-events-none opacity-50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
							}`}
					>
						<span className="relative z-10">Return to Login</span>
						<div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default EmailValidation;

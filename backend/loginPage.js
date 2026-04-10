const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { createAuthToken, verifyAuthToken } = require('./token');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
const loginTable = process.env.SUPABASE_LOGIN_TABLE || 'auth_users';
const loginSchema = process.env.SUPABASE_LOGIN_SCHEMA || 'public';



const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const loginTableRef = () => supabase.schema(loginSchema).from(loginTable);

const getUtcTimestamp = () => new Date().toISOString();


router.get('/login-logs', async (_request, response) => {
	if (!supabase) {
		return response.status(500).json({
			message: 'Supabase is not configured',
			logs: [],
		});
	}

	const { data, error } = await loginTableRef()
		.select('email, time_sign_in, time_sign_out')
		.order('email', { ascending: true });

	if (error) {
		return response.status(500).json({
			message: error.message || 'Failed to load login logs',
			logs: [],
		});
	}

	return response.json({
		ok: true,
		logs: Array.isArray(data) ? data : [],
	});
});

router.post('/login', async (request, response) => {
	try {
		const { username, password } = request.body ?? {};

		console.log('[Login] Received username:', username);

		if (!username || !password) {
			return response.status(400).json({
				message: 'Username and password are required',
			});
		}

		if (!supabase) {
			return response.status(500).json({
				message: 'Supabase is not configured',
			});
		}

		const { data, error } = await loginTableRef()
			.select('id, email')
			.eq('email', username)
			.eq('password', password)
			.maybeSingle();

		console.log('[Login] Query result:', { data, error });

		if (error || !data) {
			return response.status(401).json({
				message: error?.message || 'Invalid email or password',
			});
		}

		const loginTimestamp = getUtcTimestamp();
		console.log(`[Login] User ${data.email} signed in at ${loginTimestamp}`);
		const token = createAuthToken({
			id: data.id,
			email: data.email,
			role: 'average',
		});
		const { error: signInUpdateError } = await loginTableRef()
			.update({
				time_sign_in: loginTimestamp,
			})
			.eq('id', data.id);

		if (signInUpdateError) {
			return response.status(500).json({
				message: signInUpdateError.message || 'Failed to store sign in time',
			});
		}

		return response.json({
			ok: true,
			message: 'Login successful',
			token,
			tokenType: 'Bearer',
			user: {
				id: data.id,
				email: data.email,
				time_sign_in: loginTimestamp,
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error?.message || 'Failed to process login',
		});
	}
});

router.post('/verify-token', (request, response) => {
	const bearerToken = request.headers.authorization?.startsWith('Bearer ')
		? request.headers.authorization.slice(7)
		: '';
	const token = request.body?.jwt || request.body?.token || bearerToken;

	if (!token) {
		return response.status(400).json({
			message: 'Token is required',
		});
	}

	try {
		const decoded = verifyAuthToken(token);

		return response.json({
			ok: true,
			decoded,
		});
	} catch (error) {
		return response.status(401).json({
			ok: false,
			message: error?.message || 'Invalid token',
		});
	}
});

router.post('/signin-log', async (request, response) => {
	const { email } = request.body ?? {};

	if (!email) {
		return response.status(400).json({
			message: 'Email is required',
		});
	}

	if (!supabase) {
		return response.status(500).json({
			message: 'Supabase is not configured',
		});
	}

	try {
		const { data, error } = await loginTableRef()
			.update({
				time_sign_in: getUtcTimestamp(),
			})
			.eq('email', email)
			.select();

		if (error) {
			return response.status(400).json({
				message: error.message || 'Failed to log signin',
			});
		}

		return response.json({
			ok: true,
			message: 'Sign in logged successfully',
		});
	} catch (err) {
		return response.status(500).json({
			message: 'Failed to log signin event',
		});
	}
});

router.post('/signout-log', async (request, response) => {
	const { email } = request.body ?? {};

	if (!email) {
		return response.status(400).json({
			message: 'Email is required',
		});
	}

	if (!supabase) {
		return response.status(500).json({
			message: 'Supabase is not configured',
		});
	}

	try {
		const { data, error } = await loginTableRef()
			.update({
				time_sign_out: getUtcTimestamp(),
			})
			.eq('email', email)
			.select();

		if (error) {
			return response.status(400).json({
				message: error.message || 'Failed to log signout',
			});
		}

		return response.json({
			ok: true,
			message: 'Sign out logged successfully',
            
		});
	} catch (err) {
		return response.status(500).json({
			message: 'Failed to log signout event',
		});
	}
});

module.exports = router;

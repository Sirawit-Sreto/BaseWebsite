const jwt = require('jsonwebtoken');

const authSecret = process.env.JWT_SECRET || '@Babeboo1';
const authExpiresIn = process.env.JWT_EXPIRES_IN || '1h';

function createAuthToken(user) {
	return jwt.sign({ user }, authSecret, { expiresIn: authExpiresIn });
}

function verifyAuthToken(token) {
	return jwt.verify(token, authSecret);
}

module.exports = {
	authSecret,
	authExpiresIn,
	createAuthToken,
	verifyAuthToken,
};
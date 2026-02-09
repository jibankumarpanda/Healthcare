#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Start next dev — pick the first available port among preferredPort..preferredPort+2
const nextBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'next');
const preferredPort = parseInt(process.env.FRONTEND_PORT || process.env.PORT || '3000', 10);
const maxTries = 3;
const net = require('net');

function checkPort(port) {
	return new Promise((resolve) => {
		const srv = net.createServer();
		srv.once('error', () => {
			resolve(false);
		});
		srv.once('listening', () => {
			srv.close(() => resolve(true));
		});
		srv.listen(port, '0.0.0.0');
	});
}

(async () => {
	let portToUse = null;
	for (let i = 0; i < maxTries; i++) {
		const p = preferredPort + i;
		// Check availability
		// true => available
		// false => in use
		// We invert the result from checkPort (it returns true if we can bind)
		const canBind = await checkPort(p);
		if (canBind) {
			portToUse = p;
			break;
		}
	}

	if (!portToUse) {
		console.error(`No free port found in range ${preferredPort}..${preferredPort + maxTries - 1}`);
		process.exit(1);
	}

	const env = Object.assign({}, process.env, { PORT: String(portToUse) });
	console.log(`Starting Next dev on port ${portToUse}`);
	const child = spawn(nextBin, ['dev'], { stdio: 'inherit', shell: true, env, cwd: path.resolve(__dirname, '..') });

	child.on('close', (code) => process.exit(code));
})();

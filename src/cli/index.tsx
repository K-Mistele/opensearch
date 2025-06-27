#!/usr/bin/env node
import { render } from 'ink';
import App from './app.tsx';

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	let maxRounds = 10; // default value

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--max-rounds' && i + 1 < args.length) {
			const nextArg = args[i + 1];
			if (nextArg) {
				const value = Number.parseInt(nextArg, 10);
				if (!Number.isNaN(value) && value > 0) {
					maxRounds = value;
				} else {
					console.error('Error: --max-rounds must be a positive integer');
					process.exit(1);
				}
			}
			i++; // skip next argument as it's the value
		} else if (arg === '--help' || arg === '-h') {
			console.log(`
OpenSearch CLI - AI-Powered Multi-Round Research Agent

Usage: bun run cli [options]

Options:
  --max-rounds <number>  Maximum number of research rounds (default: 10)
  --help, -h             Show this help message

Examples:
  bun run cli
  bun run cli --max-rounds 5
			`);
			process.exit(0);
		} else if (arg?.startsWith('--')) {
			console.error(`Error: Unknown option ${arg}`);
			console.error('Use --help for usage information');
			process.exit(1);
		}
	}

	return { maxRounds };
}

const { maxRounds } = parseArgs();

render(<App maxRounds={maxRounds} />);

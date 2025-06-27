#!/usr/bin/env node
import { Box, Text, render } from 'ink';
import type { FC } from 'react';
import { MarkdownRenderer } from './components/markdown-renderer';

export const App: FC = () => {
	return (
		<Box flexDirection="column" borderStyle="round" borderColor="green">
			<Text>Hello</Text>
			<MarkdownRenderer content={'[^1,2]\n\n[^1]: test\n[^2]: test2'} />
		</Box>
	);
};
render(<App />);

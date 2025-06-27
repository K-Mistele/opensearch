#!/usr/bin/env node
import { Box, render } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type { FC } from 'react';
import { MarkdownRenderer } from './components/markdown-renderer';

export const App: FC = () => {
	return (
		<Box flexDirection="column" borderStyle="round" borderColor="green">
			<Gradient name="atlas">
				<BigText text="OpenSearch" />
			</Gradient>
			<MarkdownRenderer content={'[^1,2]\n\n[^1]: test\n[^2]: test2'} />
		</Box>
	);
};
render(<App />);

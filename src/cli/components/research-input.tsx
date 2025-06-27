import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type React from 'react';
import { useState } from 'react';

interface ResearchInputProps {
	onSubmit: (topic: string) => void;
}

export const ResearchInput: React.FC<ResearchInputProps> = ({ onSubmit }) => {
	const [query, setQuery] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = () => {
		setSubmitted(true);
		if (query.trim()) {
			onSubmit(query.trim());
		}
	};

	return (
		<Box
			flexDirection="column"
			borderColor="yellow"
			borderStyle="round"
			paddingY={1}
			paddingX={2}
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="yellow">
					🔎 Research Topic
				</Text>
			</Box>
			<Box marginBottom={1}>
				<Text color="gray">Enter what you'd like to research:</Text>
			</Box>
			<Box>
				<Text color="yellow">❯ </Text>
				<TextInput
					value={query}
					onChange={setQuery}
					onSubmit={handleSubmit}
					placeholder="Your research topic..."
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					{submitted ? '✓ Research started' : 'Press Enter to begin research'}
				</Text>
			</Box>
		</Box>
	);
};

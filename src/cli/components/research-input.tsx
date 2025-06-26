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
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold>🔎 What would you like to research?</Text>
			</Box>
			<Box>
				<Text color="gray">Topic: </Text>
				<TextInput
					value={query}
					onChange={setQuery}
					onSubmit={handleSubmit}
					placeholder="Enter your research topic..."
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					{submitted ? 'Research started.' : 'Press Enter to submit'}
				</Text>
			</Box>
		</Box>
	);
};

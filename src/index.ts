import { connection } from '@/inngest/connection';
import { subscribe } from '@inngest/realtime';
import { inngest } from './inngest/client';
import {
	type DeepResearchInvocation,
	resultsChannel,
} from './inngest/functions/deep-research';

console.log(`Inngest connected: ${connection.state}`);
const uuid = crypto.randomUUID();

console.log('Sending event');
const result = await inngest.send({
	name: 'research/deep-research.requested',
	data: {
		uuid,
		maxRounds: 10,
		research_topic: `
        Which 2023- and 2024-batch Y Combinator (YC) companies have successfully raised a series A?
        Provide the name of the company, the rount type, and amount raised.
        `,
		current_date: new Date().toLocaleDateString(),
	} satisfies DeepResearchInvocation,
});
console.log('Event sent:', result);

const stream = await subscribe({
	channel: resultsChannel(uuid),
	topics: ['initialQueries', 'webSearchResults', 'reflection', 'finalAnswer'],
});

// Example 2: Convert to an async iterator to enable for await loops
async function* streamAsyncIterator<T>(
	stream: ReadableStream<T>,
): AsyncGenerator<T> {
	// Get a lock on the stream
	const reader = stream.getReader();

	try {
		while (true) {
			// Read from the stream
			const { done, value } = await reader.read();
			// Exit if we're done
			if (done) return;
			// Else yield the chunk
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

for await (const message of streamAsyncIterator(stream)) {
	console.log(message); // `message` is fully typed
}

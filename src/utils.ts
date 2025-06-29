import type { ExtractedFact } from '@baml-client';

// Types for citation handling
export interface CitationSegment {
	label: string;
	short_url: string;
	value: string;
}

export interface CitationInfo {
	start_index: number;
	end_index: number;
	segments: CitationSegment[];
	segment_string?: string;
}

// Types for Gemini response structure
export interface WebChunk {
	uri: string;
	title: string;
}

export interface GroundingChunk {
	web: WebChunk;
}

export interface Segment {
	start_index?: number | null;
	end_index?: number | null;
}

export interface GroundingSupport {
	segment?: Segment | null;
	grounding_chunk_indices?: number[];
}

export interface GroundingMetadata {
	grounding_supports?: GroundingSupport[];
	grounding_chunks?: GroundingChunk[];
}

export interface Candidate {
	grounding_metadata?: GroundingMetadata;
}

export interface GeminiResponse {
	candidates?: Candidate[];
}

/**
 * Inserts citation markers into a text string based on start and end indices.
 *
 * @param text - The original text string
 * @param citationsList - Array of citation objects containing start_index, end_index, and segments
 * @returns The text with citation markers inserted
 */
export function insertCitationMarkers(
	text: string,
	citationsList: CitationInfo[],
): string {
	// Sort citations by end_index in descending order.
	// If end_index is the same, secondary sort by start_index descending.
	// This ensures that insertions at the end of the string don't affect
	// the indices of earlier parts of the string that still need to be processed.
	const sortedCitations = [...citationsList].sort((a, b) => {
		if (a.end_index !== b.end_index) {
			return b.end_index - a.end_index;
		}
		return b.start_index - a.start_index;
	});

	let modifiedText = text;

	for (const citationInfo of sortedCitations) {
		// These indices refer to positions in the *original* text,
		// but since we iterate from the end, they remain valid for insertion
		// relative to the parts of the string already processed.
		const endIdx = citationInfo.end_index;
		let markerToInsert = '';

		for (const segment of citationInfo.segments) {
			markerToInsert += ` [${segment.label}](${segment.short_url})`;
		}

		// Insert the citation marker at the original end_idx position
		modifiedText =
			modifiedText.slice(0, endIdx) +
			markerToInsert +
			modifiedText.slice(endIdx);
	}

	return modifiedText;
}

/**
 * Extracts and formats citation information from a Gemini model's response.
 *
 * This function processes the grounding metadata provided in the response to
 * construct a list of citation objects. Each citation object includes the
 * start and end indices of the text segment it refers to, and a string
 * containing formatted markdown links to the supporting web chunks.
 *
 * @param response - The response object from the Gemini model
 * @param resolvedUrlsMap - Map to resolve chunk URIs to resolved URLs
 * @returns Array of citation objects with start_index, end_index, and segments
 */
export function getCitations(
	response: GeminiResponse | null | undefined,
	resolvedUrlsMap: Map<string, string> | Record<string, string>,
): CitationInfo[] {
	const citations: CitationInfo[] = [];

	// Ensure response and necessary nested structures are present
	if (!response || !response.candidates) {
		return citations;
	}

	const candidate = response.candidates[0];
	if (
		!candidate ||
		!candidate.grounding_metadata ||
		!candidate.grounding_metadata.grounding_supports
	) {
		return citations;
	}

	for (const support of candidate.grounding_metadata.grounding_supports) {
		// Ensure segment information is present
		if (!support.segment) {
			continue; // Skip this support if segment info is missing
		}

		const startIndex = support.segment.start_index ?? 0;

		// Ensure end_index is present to form a valid segment
		if (
			support.segment.end_index === null ||
			support.segment.end_index === undefined
		) {
			continue; // Skip if end_index is missing, as it's crucial
		}

		const citation: CitationInfo = {
			start_index: startIndex,
			end_index: support.segment.end_index,
			segments: [],
		};

		if (
			support.grounding_chunk_indices &&
			candidate.grounding_metadata.grounding_chunks
		) {
			for (const ind of support.grounding_chunk_indices) {
				try {
					const chunk = candidate.grounding_metadata.grounding_chunks[ind];
					if (!chunk || !chunk.web) {
						continue;
					}

					// Handle both Map and Record types for resolvedUrlsMap
					const resolvedUrl =
						resolvedUrlsMap instanceof Map
							? resolvedUrlsMap.get(chunk.web.uri)
							: resolvedUrlsMap[chunk.web.uri];

					if (resolvedUrl) {
						const titleParts = chunk.web.title.split('.');
						const label =
							titleParts.length > 1
								? titleParts.slice(0, -1).join('.')
								: chunk.web.title;

						citation.segments.push({
							label,
							short_url: resolvedUrl,
							value: chunk.web.uri,
						});
					}
				} catch (error) {
					// Handle cases where chunk, web, uri, or resolved_map might be problematic
					// For simplicity, we'll just skip adding this particular segment link
					// In a production system, you might want to log this.
				}
			}
		}

		citations.push(citation);
	}

	return citations;
}

export function requireEnvironment(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is not set`);
	}
	return value;
}

/**
 * Generates a random alphanumeric string of specified length.
 *
 * @param len - The length of the string to generate
 * @returns A random alphanumeric string
 */
export function nanoid(len = 10): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < len; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return result;
}

/**
 * Processes markdown text to convert random ID footnotes to numbered footnotes
 * and adds proper MDX footnote definitions at the bottom.
 *
 * @param text - The markdown text containing footnotes like [^randomId] or [^id1,id2]
 * @param extractedFacts - Array of extracted facts to map footnote IDs to
 * @param sourcesMap - Map of sourceId to original SearchResult for url/title lookup
 * @returns The processed text with numbered footnotes and definitions
 */
export function processFootnotes(
	text: string,
	extractedFacts: Array<ExtractedFact>,
	sourcesMap: Map<string, { url: string; title: string | null }>,
): string;

/**
 * Processes markdown text to convert random ID footnotes to numbered footnotes
 * and adds proper MDX footnote definitions at the bottom.
 *
 * @param text - The markdown text containing footnotes like [^randomId] or [^id1,id2]
 * @param searchResults - Array of search results to map footnote IDs to
 * @returns The processed text with numbered footnotes and definitions
 */
export function processFootnotes(
	text: string,
	searchResults: Array<{
		id?: string | null;
		title?: string | null;
		url?: string | null;
	}>,
): string;

export function processFootnotes(
	text: string,
	sources:
		| Array<{
				id?: string | null;
				title?: string | null;
				url?: string | null;
		  }>
		| Array<ExtractedFact>,
	sourcesMap?: Map<string, { url: string; title: string | null }>,
): string {
	// Find all footnote references in the format [^ID] or [^ID1,ID2,...]
	const footnoteRegex = /\[\^([^\]]+)\]/g;
	const foundFootnotes = new Map<string, number>();
	const footnoteDefinitions: string[] = [];
	const footnoteReplacements = new Map<string, string>();
	let footnoteCounter = 1;

	// First pass: collect all unique footnote IDs and assign numbers
	let match: RegExpExecArray | null;
	footnoteRegex.lastIndex = 0; // Reset regex state

	match = footnoteRegex.exec(text);
	while (match !== null) {
		const footnoteIds = match[1];
		const fullMatch = match[0]; // The complete match like [^abc,def]

		if (footnoteIds) {
			// Split by comma to handle multiple IDs in one reference
			const individualIds = footnoteIds.split(',').map((id) => id.trim());
			const numberedRefs: string[] = [];

			for (const footnoteId of individualIds) {
				if (footnoteId && !foundFootnotes.has(footnoteId)) {
					foundFootnotes.set(footnoteId, footnoteCounter);

					let title: string | null = null;
					let url: string | null = null;

					// Handle ExtractedFact with sourcesMap
					if (
						sourcesMap &&
						sources.length > 0 &&
						sources[0] &&
						'sourceId' in sources[0]
					) {
						const sourceInfo = sourcesMap.get(footnoteId);
						if (sourceInfo) {
							title = sourceInfo.title;
							url = sourceInfo.url;
						}
					} else {
						// Handle SearchResult array
						const source = sources.find((source) => {
							return 'id' in source && source.id === footnoteId;
						});
						if (source && 'title' in source && 'url' in source) {
							title = source.title ?? null;
							url = source.url ?? null;
						}
					}

					if (title && url) {
						footnoteDefinitions.push(
							`[^${footnoteCounter}]: [${title}](${url})`,
						);
					} else {
						// Fallback if source not found
						footnoteDefinitions.push(
							`[^${footnoteCounter}]: Reference not found`,
						);
					}

					footnoteCounter++;
				}

				// Add the numbered reference for this ID
				const number = foundFootnotes.get(footnoteId);
				if (number) {
					numberedRefs.push(`${number}`);
				}
			}

			// Store the replacement for this full match
			// If multiple IDs, join with comma: [^1,2,3]
			// If single ID, just: [^1]
			const replacement = `[^${numberedRefs.join(',')}]`;
			footnoteReplacements.set(fullMatch, replacement);
		}
		match = footnoteRegex.exec(text);
	}

	// Second pass: replace all footnote references with numbered ones
	let processedText = text;
	for (const [originalMatch, replacement] of footnoteReplacements) {
		// Escape special regex characters in the original match
		const escapedMatch = originalMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		processedText = processedText.replace(
			new RegExp(escapedMatch, 'g'),
			replacement,
		);
	}

	// Add footnote definitions at the bottom if any were found
	if (footnoteDefinitions.length > 0) {
		processedText = `${processedText}\n\n---\n\n${footnoteDefinitions.join('\n')}`;
	}

	return processedText;
}

/**
 * Sanitizes a research topic or query string to make it safe for use as a filename.
 * Removes or replaces unsafe characters and limits length.
 *
 * @param query - The research topic/query string to sanitize
 * @param maxLength - Maximum length for the filename (default: 100)
 * @returns A sanitized string safe for use in filenames
 */
export function sanitizeForFilename(query: string, maxLength = 100): string {
	return (
		query
			// Replace unsafe filename characters with safe alternatives
			.replace(/[<>:"/\\|?*]/g, '-') // Replace unsafe chars with hyphens
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/\.+/g, '-') // Replace periods with hyphens (avoid issues with extensions)
			.replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
			.replace(/^-|-$/g, '') // Remove leading and trailing hyphens
			.toLowerCase() // Convert to lowercase for consistency
			.slice(0, maxLength) // Limit length
			.replace(/-$/, '')
	); // Remove trailing hyphen if created by slice
}

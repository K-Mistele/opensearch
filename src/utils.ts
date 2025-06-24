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
		let markerToInsert = "";

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
						const titleParts = chunk.web.title.split(".");
						const label =
							titleParts.length > 1
								? titleParts.slice(0, -1).join(".")
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

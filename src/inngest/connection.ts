import { connect } from 'inngest/connect';
import { inngest } from './client';
import { deepResearch } from './functions/deep-research';
import { executeSearches } from './functions/execute-searches';

export const connection = await connect({
	apps: [{ client: inngest, functions: [executeSearches, deepResearch] }],
	instanceId: 'kyleinstance',
});

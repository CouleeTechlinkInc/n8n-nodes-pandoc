import { INodeType } from 'n8n-workflow';
import { PandocConvert } from './nodes/PandocConvert/PandocConvert.node';

export const nodes: INodeType[] = [
	new PandocConvert(),
];

export const nodeTypes = nodes;

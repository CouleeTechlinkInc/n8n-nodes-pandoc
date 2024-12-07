import { INodeType } from 'n8n-workflow';
import { NpmSearch } from './nodes/NpmSearch/NpmSearch.node';

export const nodes: INodeType[] = [
	NpmSearch,
];

export const nodeTypes = nodes;
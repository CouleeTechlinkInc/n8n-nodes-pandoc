import { INodeType } from 'n8n-workflow';
import { BraveSearch } from './nodes/BraveSearch/BraveSearch.node';
import { BraveSearchApi } from './credentials/BraveSearchApi.credentials';

export { BraveSearch, BraveSearchApi };

const nodes: INodeType[] = [
    BraveSearch,
];

export const nodeTypes = nodes;
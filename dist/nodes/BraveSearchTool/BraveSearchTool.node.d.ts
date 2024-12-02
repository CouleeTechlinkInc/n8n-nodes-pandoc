import { Tool } from '@langchain/core/tools';
import { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
declare class BraveSearchTool extends Tool {
    name: string;
    description: string;
    apiKey: string;
    options: {
        country?: string;
        count?: number;
        safesearch?: 'strict' | 'moderate' | 'off';
    };
    constructor(apiKey: string, options?: {});
    _call(query: string): Promise<string>;
}
export declare class ToolBraveSearch implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<{
        json: {
            response: BraveSearchTool;
        };
    }[][]>;
}
export {};

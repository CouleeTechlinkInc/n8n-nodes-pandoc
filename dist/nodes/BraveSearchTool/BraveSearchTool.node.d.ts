import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class BraveSearchTool implements INodeType {
    description: INodeTypeDescription & {
        usableAsTool?: boolean;
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

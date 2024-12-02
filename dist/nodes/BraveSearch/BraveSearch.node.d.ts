import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class BraveSearch implements INodeType {
    description: INodeTypeDescription & {
        usableAsTool?: boolean;
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

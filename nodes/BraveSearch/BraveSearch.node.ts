import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    IDataObject,
} from 'n8n-workflow';
import axios, { AxiosResponse } from 'axios';
import { 
    IBraveSearchCredentials,
    IBraveSearchParams,
    IBraveSearchResponse
} from './types';

export class BraveSearch implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Brave Search',
        name: 'braveSearch',
        icon: 'file:brave-logo-sans-text.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Make requests to Brave Search API',
        defaults: {
            name: 'Brave Search',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'braveSearchApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Web Search',
                        value: 'webSearch',
                        description: 'Perform a web search',
                        action: 'Perform a web search',
                    },
                ],
                default: 'webSearch',
            },
            {
                displayName: 'Query',
                name: 'query',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['webSearch'],
                    },
                },
                description: 'The search query to execute',
            },
            {
                displayName: 'Additional Fields',
                name: 'additionalFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        operation: ['webSearch'],
                    },
                },
                options: [
                    {
                        displayName: 'Country',
                        name: 'country',
                        type: 'string',
                        default: '',
                        description: 'Country code for search results (e.g., US, GB)',
                    },
                    {
                        displayName: 'Results Count',
                        name: 'count',
                        type: 'number',
                        typeOptions: {
                            minValue: 1,
                            maxValue: 20,
                        },
                        default: 10,
                        description: 'Number of results to return (max: 20)',
                    },
                    {
                        displayName: 'Offset',
                        name: 'offset',
                        type: 'number',
                        typeOptions: {
                            minValue: 0,
                        },
                        default: 0,
                        description: 'Offset for pagination',
                    },
                    {
                        displayName: 'Safe Search',
                        name: 'safesearch',
                        type: 'options',
                        options: [
                            {
                                name: 'Strict',
                                value: 'strict',
                            },
                            {
                                name: 'Moderate',
                                value: 'moderate',
                            },
                            {
                                name: 'Off',
                                value: 'off',
                            },
                        ],
                        default: 'moderate',
                        description: 'Safe search setting',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                if (operation === 'webSearch') {
                    const query = this.getNodeParameter('query', i) as string;
                    const additionalFields = this.getNodeParameter('additionalFields', i) as {
                        country?: string;
                        count?: number;
                        offset?: number;
                        safesearch?: 'strict' | 'moderate' | 'off';
                    };

                    const credentials = (await this.getCredentials('braveSearchApi')) as unknown as IBraveSearchCredentials;

                    const params: IBraveSearchParams = {
                        q: query,
                    };

                    if (additionalFields.country) params.country = additionalFields.country;
                    if (additionalFields.count) params.count = additionalFields.count;
                    if (additionalFields.offset) params.offset = additionalFields.offset;
                    if (additionalFields.safesearch) params.safesearch = additionalFields.safesearch;

                    const response: AxiosResponse<IBraveSearchResponse> = await axios.get(
                        'https://api.search.brave.com/res/v1/web/search',
                        {
                            params,
                            headers: {
                                'X-Subscription-Token': credentials.apiKey,
                            },
                        }
                    );

                    // Validate response structure
                    if (!response.data || !response.data.web || !Array.isArray(response.data.web.results)) {
                        throw new Error('Invalid response structure from Brave Search API');
                    }

                    // Convert the response data to IDataObject safely
                    const responseData: IDataObject = {
                        ...response.data,
                        web: {
                            ...(response.data.web || {}),
                            results: (response.data.web.results || []).map(result => ({
                                ...result,
                                title: result.title || '',
                                url: result.url || '',
                                description: result.description || ''
                            }))
                        }
                    };

                    returnData.push({
                        json: responseData,
                        pairedItem: i,
                    });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            details: error.response?.data || 'No additional error details available',
                            status: error.response?.status || 'Unknown status',
                        },
                        pairedItem: i,
                    });
                    continue;
                }
                const errorMessage = error.response?.data
                    ? `API Error: ${error.message}. Details: ${JSON.stringify(error.response.data)}`
                    : `Error: ${error.message}`;
                throw new NodeOperationError(this.getNode(), new Error(errorMessage));
            }
        }

        return [returnData];
    }
}
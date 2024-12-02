import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    IDataObject,
} from 'n8n-workflow';
import axios from 'axios';

interface IBraveSearchParams {
    q: string;
    country?: string;
    count?: number;
    offset?: number;
    safesearch?: 'strict' | 'moderate' | 'off';
}

interface IBraveSearchResult {
    title: string;
    url: string;
    description: string;
    [key: string]: unknown;
}

interface IBraveSearchResponse {
    web: {
        results: IBraveSearchResult[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

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
        let query = '';
        let params: IBraveSearchParams | undefined;

        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i) as string;

                if (operation === 'webSearch') {
                    query = this.getNodeParameter('query', i) as string;
                    const additionalFields = this.getNodeParameter('additionalFields', i) as {
                        country?: string;
                        count?: number;
                        offset?: number;
                        safesearch?: 'strict' | 'moderate' | 'off';
                    };

                    const credentials = await this.getCredentials('braveSearchApi');
                    
                    if (!credentials?.apiKey) {
                        throw new Error('No API key provided in credentials');
                    }

                    params = {
                        q: query,
                        ...additionalFields,
                    };

                    try {
                        const response = await axios.get<IBraveSearchResponse>(
                            'https://api.search.brave.com/res/v1/web/search',
                            {
                                params,
                                headers: {
                                    'X-Subscription-Token': credentials.apiKey as string,
                                    'Accept': 'application/json',
                                },
                            }
                        );

                        // Log response structure for debugging
                        console.log('Response status:', response.status);
                        console.log('Response data structure:', Object.keys(response.data));
                        
                        if (!response.data) {
                            throw new Error('Empty response from Brave Search API');
                        }

                        if (!response.data.web || !Array.isArray(response.data.web.results)) {
                            throw new Error(`Invalid response structure. Got: ${JSON.stringify(response.data)}`);
                        }

                        const responseData: IDataObject = {
                            ...response.data,
                            web: {
                                ...(response.data.web || {}),
                                results: response.data.web.results.map((result: IBraveSearchResult) => ({
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
                    } catch (error: any) {
                        if (axios.isAxiosError(error)) {
                            throw new Error(
                                `API Request failed: ${error.message}. ` +
                                `Status: ${error.response?.status}. ` +
                                `Response: ${JSON.stringify(error.response?.data)}`
                            );
                        }
                        throw error;
                    }
                }
            } catch (error: any) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            details: error.response?.data || 'No additional error details available',
                            status: error.response?.status || 'Unknown status',
                            query: query || 'No query provided',
                            params: params || 'No params available'
                        },
                        pairedItem: i,
                    });
                    continue;
                }
                throw new NodeOperationError(
                    this.getNode(),
                    `Execution failed: ${error.message}`,
                    {
                        description: error.response?.data 
                            ? `API Response: ${JSON.stringify(error.response.data)}`
                            : undefined,
                        itemIndex: i,
                    }
                );
            }
        }

        return [returnData];
    }
}
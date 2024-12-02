"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BraveSearch = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const axios_1 = __importDefault(require("axios"));
class BraveSearch {
    constructor() {
        this.description = {
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
    }
    async execute() {
        var _a, _b, _c;
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        for (let i = 0; i < items.length; i++) {
            try {
                if (operation === 'webSearch') {
                    const query = this.getNodeParameter('query', i);
                    const additionalFields = this.getNodeParameter('additionalFields', i);
                    const credentials = (await this.getCredentials('braveSearchApi'));
                    const params = {
                        q: query,
                    };
                    if (additionalFields.country)
                        params.country = additionalFields.country;
                    if (additionalFields.count)
                        params.count = additionalFields.count;
                    if (additionalFields.offset)
                        params.offset = additionalFields.offset;
                    if (additionalFields.safesearch)
                        params.safesearch = additionalFields.safesearch;
                    const response = await axios_1.default.get('https://api.search.brave.com/res/v1/web/search', {
                        params,
                        headers: {
                            'X-Subscription-Token': credentials.apiKey,
                        },
                    });
                    const responseData = {
                        ...response.data,
                        web: {
                            ...response.data.web,
                            results: response.data.web.results.map(result => ({
                                ...result
                            }))
                        }
                    };
                    returnData.push({
                        json: responseData,
                        pairedItem: i,
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            details: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || 'No additional error details available',
                            status: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 'Unknown status',
                        },
                        pairedItem: i,
                    });
                    continue;
                }
                const errorMessage = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data)
                    ? `API Error: ${error.message}. Details: ${JSON.stringify(error.response.data)}`
                    : `Error: ${error.message}`;
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), new Error(errorMessage));
            }
        }
        return [returnData];
    }
}
exports.BraveSearch = BraveSearch;
//# sourceMappingURL=BraveSearch.node.js.map
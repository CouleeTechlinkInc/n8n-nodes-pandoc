"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolBraveSearch = void 0;
const tools_1 = require("@langchain/core/tools");
const axios_1 = __importDefault(require("axios"));
class BraveSearchTool extends tools_1.Tool {
    constructor(apiKey, options = {}) {
        super();
        this.name = 'brave_search';
        this.description = 'A tool for performing web searches using Brave Search API';
        this.apiKey = apiKey;
        this.options = options;
    }
    async _call(query) {
        var _a, _b, _c;
        try {
            const response = await axios_1.default.get('https://api.search.brave.com/res/v1/web/search', {
                params: {
                    q: query,
                    ...this.options,
                },
                headers: {
                    'X-Subscription-Token': this.apiKey,
                    'Accept': 'application/json',
                },
            });
            if (!((_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.web) === null || _b === void 0 ? void 0 : _b.results) === null || _c === void 0 ? void 0 : _c.length)) {
                return 'No results found';
            }
            const results = response.data.web.results.slice(0, 3);
            return results
                .map((r) => `${r.title}\n${r.description}\nURL: ${r.url}`)
                .join('\n\n');
        }
        catch (error) {
            return `Error performing Brave search: ${error.message}`;
        }
    }
}
class ToolBraveSearch {
    constructor() {
        this.description = {
            displayName: 'Brave Search Tool',
            name: 'toolBraveSearch',
            icon: 'file:brave-logo-sans-text.svg',
            group: ['transform'],
            version: 1,
            description: 'Use Brave Search in your LLM Tools',
            defaults: {
                name: 'Brave Search Tool',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Tools'],
                    Tools: ['Search Tools'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: ['ai_tool'],
            outputNames: ['Tool'],
            credentials: [
                {
                    name: 'braveSearchApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Connection Type Notice',
                    name: 'connectionTypeNotice',
                    type: 'notice',
                    default: 'For use with AI Agents only',
                    displayOptions: {
                        show: {
                            '@version': [1],
                        },
                    },
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Country',
                            name: 'country',
                            type: 'string',
                            default: 'US',
                            description: 'Country code for search results (e.g., US, GB)',
                        },
                        {
                            displayName: 'Results Count',
                            name: 'count',
                            type: 'number',
                            default: 3,
                            description: 'Number of results to return in each search',
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
        const credentials = await this.getCredentials('braveSearchApi');
        const options = this.getNodeParameter('options', 0);
        return [[{
                    json: {
                        response: new BraveSearchTool(credentials.apiKey, options),
                    },
                }]];
    }
}
exports.ToolBraveSearch = ToolBraveSearch;

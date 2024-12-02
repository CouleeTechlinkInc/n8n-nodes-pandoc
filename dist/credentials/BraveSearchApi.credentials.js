"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BraveSearchApi = void 0;
class BraveSearchApi {
    constructor() {
        this.name = 'braveSearchApi';
        this.displayName = 'Brave Search API';
        this.documentationUrl = 'https://api.search.brave.com/app/documentation/web-search';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'The API key for Brave Search. Get it from https://api.search.brave.com/app/keys',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'X-Subscription-Token': '={{$credentials.apiKey}}',
                    'Accept': 'application/json',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.search.brave.com/res/v1',
                url: '/web/search',
                method: 'GET',
                qs: {
                    q: 'test'
                },
                headers: {
                    'Accept': 'application/json',
                },
                skipSslCertificateValidation: false,
            },
        };
    }
}
exports.BraveSearchApi = BraveSearchApi;

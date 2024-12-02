import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class BraveSearchApi implements ICredentialType {
    name = 'braveSearchApi';
    displayName = 'Brave Search API';
    documentationUrl = 'https://api.search.brave.com/app/documentation/web-search';
    
    properties: INodeProperties[] = [
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

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'X-Subscription-Token': '={{$credentials.apiKey}}',
                'Accept': 'application/json',
            },
        },
    };

    test: ICredentialTestRequest = {
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
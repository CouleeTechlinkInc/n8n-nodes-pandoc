import { IDataObject } from 'n8n-workflow';
export interface IBraveSearchCredentials {
    apiKey: string;
}
export interface IBraveSearchParams extends IDataObject {
    q: string;
    country?: string;
    count?: number;
    offset?: number;
    safesearch?: 'strict' | 'moderate' | 'off';
}
export interface IBraveSearchResponse {
    web: {
        results: Array<{
            title: string;
            url: string;
            description: string;
        }>;
        total?: number;
    };
}

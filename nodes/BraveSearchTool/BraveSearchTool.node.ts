import { Tool } from '@langchain/core/tools';
import {
	NodeConnectionType,
	type INodeType,
	type INodeTypeDescription,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import axios from 'axios';

class BraveSearchTool extends Tool {
	name = 'brave_search';
	description = 'A tool for performing web searches using Brave Search API';
	apiKey: string;
	options: {
		country?: string;
		count?: number;
		safesearch?: 'strict' | 'moderate' | 'off';
	};

	constructor(apiKey: string, options = {}) {
		super();
		this.apiKey = apiKey;
		this.options = options;
	}

	async _call(query: string): Promise<string> {
		try {
			const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
				params: {
					q: query,
					...this.options,
				},
				headers: {
					'X-Subscription-Token': this.apiKey,
					'Accept': 'application/json',
				},
			});

			if (!response.data?.web?.results?.length) {
				return 'No results found';
			}

			const results = response.data.web.results.slice(0, 3);
			return results
				.map((r: any) => `${r.title}\n${r.description}\nURL: ${r.url}`)
				.join('\n\n');
		} catch (error) {
			return `Error performing Brave search: ${error.message}`;
		}
	}
}

export class ToolBraveSearch implements INodeType {
	description: INodeTypeDescription = {
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolbravesearch/',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionType.AiTool],
		outputNames: ['Tool'],
		credentials: [
			{
				name: 'braveSearchApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'This node must be connected to an AI Agent',
				name: 'notice',
				type: 'notice',
				default: '',
				typeOptions: {
					containerClass: 'ndv-connection-hint-notice',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('braveSearchApi');
		const options = this.getNodeParameter('options', 0) as {
			country?: string;
			count?: number;
			safesearch?: 'strict' | 'moderate' | 'off';
		};

		const tool = new BraveSearchTool(credentials.apiKey as string, options);
		
		return [[{
			json: {
				response: tool
			},
		}]];
	}
} 
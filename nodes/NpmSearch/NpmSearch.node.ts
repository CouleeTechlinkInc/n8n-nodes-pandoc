import {
    IExecuteFunctions ,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class NpmSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NPM Search',
		name: 'npmSearch',
		icon: 'file:npm.svg',
		group: ['transform'],
		version: 1,
		description: 'Search for NPM packages using AI-powered relevance scoring',
		defaults: {
			name: 'NPM Search',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				'AI': ['Tools']
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/yourusername/n8n-nodes-npm-tools',
					},
				],
			},
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search Packages',
						value: 'search',
						description: 'Search for NPM packages using AI-powered relevance scoring',
						action: 'Search for NPM packages',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				placeholder: 'e.g. n8n',
				description: 'The search term to look for in NPM packages',
				required: true,
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 20,
				description: 'Number of results to return',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'number',
				default: 0,
				description: 'Offset for pagination',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'search') {
					const searchQuery = this.getNodeParameter('searchQuery', i) as string;
					const size = this.getNodeParameter('size', i) as number;
					const from = this.getNodeParameter('from', i) as number;

					const response = await axios.get(`https://registry.npmjs.org/-/v1/search`, {
						params: {
							text: searchQuery,
							size,
							from,
						},
					});

					const packages = response.data.objects.map((pkg: any) => ({
						name: pkg.package.name,
						version: pkg.package.version,
						description: pkg.package.description,
						keywords: pkg.package.keywords,
						author: pkg.package.author,
						publisher: pkg.package.publisher,
						maintainers: pkg.package.maintainers,
						links: pkg.package.links,
						score: pkg.score,
						searchScore: pkg.searchScore,
						aiRelevanceScore: pkg.score.final * pkg.searchScore,
					}));

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(packages),
						{ itemData: { item: i } },
					);

					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error);
			}
		}

		return [returnData];
	}
} 
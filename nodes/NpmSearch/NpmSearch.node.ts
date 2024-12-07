import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
} from 'n8n-workflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
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
        inputs: [],
        outputs: [NodeConnectionType.AiTool],
        properties: [],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const npmSearchTool = new DynamicStructuredTool({
            name: 'npm_search',
            description: 'Search for NPM packages. Use this when you need to find Node.js packages, their versions, descriptions, and relevance scores.',
            schema: z.object({
                searchQuery: z.string().describe('The search term to look for in NPM packages'),
                size: z.number().optional().describe('Number of results to return (default: 20)'),
                from: z.number().optional().describe('Offset for pagination (default: 0)'),
            }),
            func: async ({ searchQuery, size = 20, from = 0 }) => {
                try {
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

                    return JSON.stringify(packages);
                } catch (error) {
                    throw new Error(`Failed to search NPM: ${error.message}`);
                }
            },
        });

        return [[{ json: { tools: [npmSearchTool] } }]];
    }
} 
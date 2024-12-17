import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
} from 'n8n-workflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import pandoc from 'node-pandoc';
import { promisify } from 'util';

const pandocAsync = promisify(pandoc);

export class PandocConvert implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Pandoc Convert',
        name: 'pandocConvert',
        icon: 'file:pandoc.svg',
        group: ['transform'],
        version: 1,
        description: 'Convert documents between different formats using Pandoc',
        defaults: {
            name: 'Pandoc Convert',
        },
        codex: {
            categories: ['AI'],
            subcategories: {
                'AI': ['Tools']
            },
            resources: {
                primaryDocumentation: [
                    {
                        url: 'https://github.com/yourusername/n8n-nodes-pandoc',
                    },
                ],
            },
        },
        inputs: ['main'],
        outputs: [NodeConnectionType.AiTool , 'main'],
        properties: [],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const pandocTool = new DynamicStructuredTool({
            name: 'pandoc_convert',
            description: 'Convert documents between different formats using Pandoc. Supports markdown, docx, pdf, html, latex, and many other formats.',
            schema: z.object({
                content: z.string().describe('The content to convert (can be file content in base64 or plain text)'),
                fromFormat: z.string().describe('The input format (e.g., docx, markdown, html, latex)'),
                toFormat: z.string().describe('The output format (e.g., markdown, docx, pdf, html, latex)'),
                options: z.string().optional().describe('Additional pandoc options (e.g., --standalone, --toc)'),
            }),
            func: async ({ content, fromFormat, toFormat, options = '' }) => {
                try {
                    let inputContent = content;
                    
                    // If content is base64, decode it
                    if (content.match(/^[A-Za-z0-9+/=]+$/)) {
                        inputContent = Buffer.from(content, 'base64').toString();
                    }

                    // Build pandoc arguments
                    const args = [
                        '-f', fromFormat,
                        '-t', toFormat,
                        ...options.split(' ').filter(Boolean)
                    ];

                    // Convert using pandoc
                    const result = await pandocAsync(inputContent, args);

                    // For binary formats like PDF, DOCX, encode as base64
                    if (['pdf', 'docx', 'odt'].includes(toFormat)) {
                        return Buffer.from(result).toString('base64');
                    }

                    return result;
                } catch (error) {
                    throw new Error(`Pandoc conversion failed: ${error.message}`);
                }
            },
        });

        return [[{ json: { tools: [pandocTool] } }]];
    }
}

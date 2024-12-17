import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
} from 'n8n-workflow';
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
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                description: 'Name of the binary property that contains the file to convert',
            },
            {
                displayName: 'From Format',
                name: 'fromFormat',
                type: 'options',
                options: [
                    {
                        name: 'Markdown',
                        value: 'markdown'
                    },
                    {
                        name: 'HTML',
                        value: 'html'
                    },
                    {
                        name: 'Microsoft Word',
                        value: 'docx'
                    },
                    {
                        name: 'LaTeX',
                        value: 'latex'
                    },
                    {
                        name: 'Plain Text',
                        value: 'plain'
                    }
                ],
                default: 'markdown',
                description: 'Input format of the document',
            },
            {
                displayName: 'To Format',
                name: 'toFormat',
                type: 'options',
                options: [
                    {
                        name: 'Markdown',
                        value: 'markdown'
                    },
                    {
                        name: 'HTML',
                        value: 'html'
                    },
                    {
                        name: 'Microsoft Word',
                        value: 'docx'
                    },
                    {
                        name: 'PDF',
                        value: 'pdf'
                    },
                    {
                        name: 'LaTeX',
                        value: 'latex'
                    },
                    {
                        name: 'Plain Text',
                        value: 'plain'
                    }
                ],
                default: 'html',
                description: 'Output format for the document',
            },
            {
                displayName: 'Additional Options',
                name: 'options',
                type: 'string',
                default: '',
                description: 'Additional pandoc options (e.g., --standalone --toc)',
                required: false,
            }
        ],
    };

    private static getMimeType(format: string): string {
        const mimeTypes: { [key: string]: string } = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'html': 'text/html',
            'markdown': 'text/markdown',
            'latex': 'application/x-latex',
            'plain': 'text/plain',
        };
        return mimeTypes[format] || 'application/octet-stream';
    }

    private static getFileName(originalName: string, newFormat: string): string {
        const baseName = originalName.split('.').slice(0, -1).join('.');
        return `${baseName}.${PandocConvert.getFileExtension(newFormat)}`;
    }

    private static getFileExtension(format: string): string {
        const extensions: { [key: string]: string } = {
            'pdf': 'pdf',
            'docx': 'docx',
            'html': 'html',
            'markdown': 'md',
            'latex': 'tex',
            'plain': 'txt',
        };
        return extensions[format] || format;
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                const fromFormat = this.getNodeParameter('fromFormat', i) as string;
                const toFormat = this.getNodeParameter('toFormat', i) as string;
                const options = (this.getNodeParameter('options', i) as IDataObject).toString();

                const binaryData = items[i].binary?.[binaryPropertyName];
                if (!binaryData) {
                    throw new Error(`No binary data found in property "${binaryPropertyName}"`);
                }

                const content = Buffer.from(binaryData.data, 'base64').toString();

                // Build pandoc arguments
                const args = [
                    '-f', fromFormat,
                    '-t', toFormat,
                    ...options.split(' ').filter(Boolean)
                ];

                // Convert using pandoc
                const result = await pandocAsync(content, args);

                // Create the new binary data
                const newBinaryData = {
                    [binaryPropertyName]: {
                        data: Buffer.from(result).toString('base64'),
                        mimeType: PandocConvert.getMimeType(toFormat),
                        fileName: PandocConvert.getFileName(binaryData.fileName || 'document', toFormat),
                    }
                };

                returnData.push({
                    json: items[i].json,
                    binary: newBinaryData,
                });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        binary: {},
                    });
                    continue;
                }
                throw error;
            }
        }

        return [returnData];
    }
}

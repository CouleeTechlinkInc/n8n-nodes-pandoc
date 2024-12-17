import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IBinaryKeyData,
} from 'n8n-workflow';
import pandoc from 'node-pandoc';
import { promisify } from 'util';
import { writeFile, readFile, unlink, readdir, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

const pandocAsync = promisify(pandoc);

interface PandocError extends Error {
    code?: string;
    stdout?: string;
    stderr?: string;
}

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
        outputs: [
            {
                type: 'main',
                displayName: 'Converted Document',
                required: true,
            },
            {
                type: 'main',
                displayName: 'Extracted Images',
                required: false,
            },
        ],
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
        const mimeTypes: Record<string, string> = {
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
        const extensions: Record<string, string> = {
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
        const imageData: INodeExecutionData[] = [];

        const cleanupFiles = async (paths: string[]): Promise<void> => {
            await Promise.all(
                paths.map(async (path) => {
                    try {
                        const stat = await import('fs/promises').then(fs => fs.stat(path));
                        if (stat.isDirectory()) {
                            await rmdir(path, { recursive: true });
                        } else {
                            await unlink(path);
                        }
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                })
            );
        };

        for (let i = 0; i < items.length; i++) {
            const tempPaths: string[] = [];
            try {
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                const fromFormat = this.getNodeParameter('fromFormat', i) as string;
                const toFormat = this.getNodeParameter('toFormat', i) as string;
                const options = this.getNodeParameter('options', i, '') as string;

                const binaryData = items[i].binary?.[binaryPropertyName];
                if (!binaryData) {
                    throw new Error(`No binary data found in property "${binaryPropertyName}"`);
                }

                // Create temporary file paths
                const tempDir = tmpdir();
                const tempId = uuidv4();
                const inputPath = join(tempDir, `pandoc_input_${tempId}`);
                const outputPath = join(tempDir, `pandoc_output_${tempId}`);
                const mediaDir = join(tempDir, `media_${tempId}`);

                tempPaths.push(inputPath, outputPath, mediaDir);

                // Create media directory for image extraction
                await mkdir(mediaDir, { recursive: true });

                // Write input file
                const buffer = Buffer.from(binaryData.data, 'base64');
                await writeFile(inputPath, buffer);

                // Build pandoc arguments
                const args = [
                    '-f', fromFormat,
                    '-t', toFormat,
                    '-o', outputPath,
                    '--extract-media', mediaDir,
                    ...options.split(' ').filter(Boolean)
                ];

                // Convert using pandoc
                await pandocAsync(inputPath, args);

                // Read output file
                const outputContent = await readFile(outputPath);

                // Create the new binary data for the main output
                const newBinaryData: IBinaryKeyData = {
                    [binaryPropertyName]: {
                        data: outputContent.toString('base64'),
                        mimeType: PandocConvert.getMimeType(toFormat),
                        fileName: PandocConvert.getFileName(binaryData.fileName || 'document', toFormat),
                    }
                };

                returnData.push({
                    json: items[i].json,
                    binary: newBinaryData,
                });

                // Handle extracted images if converting to markdown
                try {
                    const mediaFiles = await readdir(mediaDir);
                    for (const file of mediaFiles) {
                        const filePath = join(mediaDir, file);
                        const fileContent = await readFile(filePath);
                        const mimeType = mime.lookup(file) || 'application/octet-stream';

                        imageData.push({
                            json: {
                                sourceDocument: binaryData.fileName,
                                imageName: file,
                            },
                            binary: {
                                image: {
                                    data: fileContent.toString('base64'),
                                    mimeType,
                                    fileName: file,
                                }
                            }
                        });
                    }
                } catch (error) {
                    // Ignore errors reading media directory
                    // This is expected when no images are extracted
                }
            } catch (error) {
                const pandocError = error as PandocError;
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: pandocError.message,
                            code: pandocError.code,
                            stdout: pandocError.stdout,
                            stderr: pandocError.stderr,
                        },
                        binary: {},
                    });
                    continue;
                }
                throw error;
            } finally {
                // Clean up temporary files
                await cleanupFiles(tempPaths);
            }
        }

        return [returnData, imageData];
    }
}

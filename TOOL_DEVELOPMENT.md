# N8N Tool Node Development Guide

## Overview

This guide explains how to develop Tool nodes for n8n that can be used with AI Agents. Tool nodes are special nodes that provide functionality that can be used by AI models through the Agent node.

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "n8n-workflow": "~1.0.0",
    "@langchain/core": "^0.1.0",
    "zod": "^3.22.4"
  }
}
```

## Basic Structure

A Tool node consists of two main files:
1. `MyTool.node.json` - Node metadata
2. `MyTool.node.ts` - Node implementation

### Node Metadata (MyTool.node.json)

```json
{
    "node": "n8n-nodes-base.myTool",
    "nodeVersion": "1.0",
    "codexVersion": "1.0",
    "categories": ["AI"],
    "subcategories": {
        "AI": ["Tools"]
    },
    "resources": {
        "primaryDocumentation": [
            {
                "url": "https://github.com/yourusername/your-tool-repo"
            }
        ]
    },
    "alias": ["tool", "ai"],
    "description": "Your tool description",
    "name": "My Tool",
    "group": ["transform"],
    "defaults": {
        "name": "My Tool"
    }
}
```

### Node Implementation (MyTool.node.ts)

Basic template for a tool node:

```typescript
import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
} from 'n8n-workflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export class MyTool implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'My Tool',
        name: 'myTool',
        icon: 'file:myTool.svg',
        group: ['transform'],
        version: 1,
        description: 'Description of what your tool does',
        defaults: {
            name: 'My Tool',
        },
        codex: {
            categories: ['AI'],
            subcategories: {
                'AI': ['Tools']
            },
            resources: {
                primaryDocumentation: [
                    {
                        url: 'https://github.com/yourusername/your-tool-repo',
                    },
                ],
            },
        },
        inputs: [],  // Tool nodes typically don't have regular inputs
        outputs: [NodeConnectionType.AiTool],  // Must output as AiTool
        properties: [],  // Tool configuration is handled in the tool schema
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        // Create your tool
        const myTool = new DynamicStructuredTool({
            name: 'my_tool_name',
            description: 'Detailed description of what your tool does and when to use it',
            schema: z.object({
                input1: z.string().describe('Description of input1'),
                input2: z.number().describe('Description of input2'),
                optionalInput: z.string().optional().describe('Optional input description'),
            }),
            func: async ({ input1, input2, optionalInput }) => {
                try {
                    // Your tool logic here
                    const result = await someFunction(input1, input2, optionalInput);
                    return JSON.stringify(result);
                } catch (error) {
                    throw new Error(`Tool execution failed: ${error.message}`);
                }
            },
        });

        // Return the tool
        return [[{ json: { tools: [myTool] } }]];
    }
}
```

## Multiple Tools Example

You can provide multiple tools from a single node:

```typescript
export class MultiTool implements INodeType {
    description: INodeTypeDescription = {
        // ... same as above ...
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const tool1 = new DynamicStructuredTool({
            name: 'tool_one',
            description: 'First tool description',
            schema: z.object({
                input: z.string().describe('Tool one input'),
            }),
            func: async ({ input }) => {
                // Tool one logic
                return 'Tool one result';
            },
        });

        const tool2 = new DynamicStructuredTool({
            name: 'tool_two',
            description: 'Second tool description',
            schema: z.object({
                param1: z.number().describe('First parameter'),
                param2: z.string().describe('Second parameter'),
            }),
            func: async ({ param1, param2 }) => {
                // Tool two logic
                return 'Tool two result';
            },
        });

        return [[{ json: { tools: [tool1, tool2] } }]];
    }
}
```

## Real-World Example: NPM Search Tool

Here's a complete example of a tool that searches NPM packages:

```typescript
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
                        params: { text: searchQuery, size, from },
                    });

                    const packages = response.data.objects.map((pkg: any) => ({
                        name: pkg.package.name,
                        version: pkg.package.version,
                        description: pkg.package.description,
                        keywords: pkg.package.keywords,
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
```

## Best Practices

1. **Tool Names**:
   - Use snake_case for tool names
   - Make names descriptive but concise
   - Ensure names are unique when providing multiple tools

2. **Descriptions**:
   - Write clear, detailed descriptions
   - Explain when and how to use the tool
   - Include example inputs if helpful

3. **Schema**:
   - Use Zod for input validation
   - Provide descriptions for all parameters
   - Make parameters optional when appropriate
   - Use appropriate types (string, number, boolean, etc.)

4. **Error Handling**:
   - Always wrap tool logic in try/catch
   - Return meaningful error messages
   - Consider edge cases

5. **Output Format**:
   - Return stringified JSON for complex data
   - Keep responses concise but informative
   - Structure data in a way that's easy for AI to parse

## Testing Your Tool

1. Install your tool package in n8n
2. Add an AI Agent node to your workflow
3. Click "Add Tool" and look for your tool
4. Test the tool with various inputs
5. Check the AI's ability to understand and use your tool

## Common Issues

1. **Tool Not Showing Up**:
   - Verify `NodeConnectionType.AiTool` is set as output
   - Check categories and subcategories in metadata
   - Ensure node is properly built and installed

2. **Tool Not Working**:
   - Check error messages in n8n logs
   - Verify input schema matches implementation
   - Test tool function independently

3. **AI Not Using Tool**:
   - Improve tool description
   - Make input parameters more clear
   - Add examples in description

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [LangChain Tools Documentation](https://js.langchain.com/docs/modules/agents/tools/)
- [Zod Documentation](https://zod.dev/)
declare module 'node-pandoc' {
    type PandocCallback = (err: Error | null, result: string) => void;
    
    function pandoc(src: string, args: string[], callback: PandocCallback): void;
    function pandoc(src: string, callback: PandocCallback): void;
    
    // Add overload for promisified version
    namespace pandoc {
        function __promisify__(src: string, args: string[]): Promise<string>;
        function __promisify__(src: string): Promise<string>;
    }
    
    export = pandoc;
}

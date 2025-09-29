declare module 'epub-parser' {
  export interface EPubMetadata {
    title?: string;
    creator?: string;
    language?: string;
    publisher?: string;
    date?: string;
  }

  export interface EPubSpineItem {
    id: string;
    href: string;
    title?: string;
    index: number;
  }

  export interface EPubParsed {
    metadata: EPubMetadata;
    spine: EPubSpineItem[];
    getChapter(id: string): Promise<string>;
  }

  export function parse(buffer: Buffer): Promise<EPubParsed>;
}
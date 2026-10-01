/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
interface Window {
  showSaveFilePicker?: (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
    name: string;
    createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
  }>;
}

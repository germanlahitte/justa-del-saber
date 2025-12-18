export {};

declare global {
  interface Window {
    api: {
      openExternal: (filePath: string) => Promise<{ success: boolean; error?: any }>;
    };
  }
}

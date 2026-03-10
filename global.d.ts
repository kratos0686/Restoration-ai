// Type declarations for AI Studio browser API
interface Window {
  aistudio?: {
    openSelectKey: () => Promise<void>;
  };
}

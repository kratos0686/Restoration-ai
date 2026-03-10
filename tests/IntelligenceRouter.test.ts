import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceRouter } from '../services/IntelligenceRouter';

// Mock the @google/genai SDK
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: () => '{"category":"General","summary":"test","structuredData":{},"action":""}',
  });

  const mockGenerateContentStream = vi.fn().mockResolvedValue(
    (async function* () { yield { text: 'Hello' }; yield { text: ' World' }; })()
  );

  const mockGenerateVideos = vi.fn().mockResolvedValue({ name: 'operations/123' });

  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
        generateVideos: mockGenerateVideos,
      },
      operations: {},
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      NUMBER: 'NUMBER',
    },
  };
});

describe('IntelligenceRouter', () => {
  describe('constructor', () => {
    it('defaults to gemini backend', () => {
      const router = new IntelligenceRouter();
      expect(router.backend).toBe('gemini');
    });

    it('accepts vertex backend', () => {
      const router = new IntelligenceRouter('vertex');
      expect(router.backend).toBe('vertex');
    });
  });

  describe('execute()', () => {
    let router: IntelligenceRouter;

    beforeEach(() => {
      router = new IntelligenceRouter();
    });

    it('throws for VIDEO_GENERATION complexity', async () => {
      await expect(router.execute('VIDEO_GENERATION', 'test')).rejects.toThrow();
    });

    it('returns a response for FAST_ANALYSIS', async () => {
      const response = await router.execute('FAST_ANALYSIS', 'test prompt');
      expect(response).toBeDefined();
      expect(typeof response.text).toBe('function');
    });

    it('returns a response for LITE_ANALYSIS', async () => {
      const response = await router.execute('LITE_ANALYSIS', 'simple question');
      expect(response).toBeDefined();
    });

    it('returns a response for DEEP_REASONING', async () => {
      const response = await router.execute('DEEP_REASONING', 'complex task');
      expect(response).toBeDefined();
    });
  });

  describe('stream()', () => {
    let router: IntelligenceRouter;

    beforeEach(() => {
      router = new IntelligenceRouter();
    });

    it('throws for VIDEO_GENERATION complexity', async () => {
      await expect(router.stream('VIDEO_GENERATION', 'test')).rejects.toThrow();
    });

    it('yields string chunks for FAST_ANALYSIS', async () => {
      const chunks = await router.stream('FAST_ANALYSIS', 'test prompt');
      const collected: string[] = [];
      for await (const chunk of chunks) {
        collected.push(chunk);
      }
      expect(collected.length).toBeGreaterThan(0);
      collected.forEach(c => expect(typeof c).toBe('string'));
    });
  });

  describe('generateVideo()', () => {
    it('calls generateVideos on the model', async () => {
      const router = new IntelligenceRouter();
      const result = await router.generateVideo('a flooded room');
      expect(result).toBeDefined();
    });

    it('includes image bytes when image is provided', async () => {
      const router = new IntelligenceRouter();
      const fakeBase64 = 'data:image/png;base64,abc123';
      const result = await router.generateVideo('a flooded room', fakeBase64);
      expect(result).toBeDefined();
    });
  });

  describe('getOperationsClient()', () => {
    it('returns the operations object', () => {
      const router = new IntelligenceRouter();
      expect(router.getOperationsClient()).toBeDefined();
    });
  });
});

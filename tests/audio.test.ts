import { describe, it, expect } from 'vitest';
import { encode, decode } from '../utils/audio';

describe('audio encode/decode', () => {
  it('encode produces a base64 string', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = encode(bytes);
    expect(typeof result).toBe('string');
    expect(result).toBe(btoa('Hello'));
  });

  it('decode reverses encode', () => {
    const original = new Uint8Array([1, 2, 3, 4, 255, 128, 0]);
    const encoded = encode(original);
    const decoded = decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('encode/decode is lossless across arbitrary byte values', () => {
    const original = new Uint8Array(256).map((_, i) => i);
    const roundtripped = decode(encode(original));
    expect(roundtripped).toEqual(original);
  });

  it('decode handles empty base64', () => {
    const result = decode(btoa(''));
    expect(result.length).toBe(0);
  });
});

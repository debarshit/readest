import { describe, expect, it } from 'vitest';
import { getCoverImageUrl } from '@/services/bookService';
import { CLOUD_BOOKS_SUBDIR } from '@/services/constants';
import type { Book } from '@/types/book';

describe('Storage and Cover Sync enhancements', () => {
  it('uses Yomi/Books for CLOUD_BOOKS_SUBDIR', () => {
    expect(CLOUD_BOOKS_SUBDIR).toBe('Yomi/Books');
  });

  it('appends cache buster query parameter to coverImageUrl when coverHash is present', () => {
    const mockCtx = {
      fs: {
        getURL: (p: string) => `asset://localhost/${p}`,
      } as any,
      appPlatform: 'tauri' as const,
      localBooksDir: '/Users/test/Yomi/Books',
    };

    const bookWithHash = {
      hash: 'abc123hash',
      coverHash: 'hash98765',
      format: 'EPUB',
    } as Book;

    const urlWithHash = getCoverImageUrl(mockCtx, bookWithHash);
    expect(urlWithHash).toBe(
      'asset://localhost//Users/test/Yomi/Books/abc123hash/cover.png?v=hash98765',
    );
  });

  it('appends cache buster query parameter using coverUpdatedAt when coverHash is absent', () => {
    const mockCtx = {
      fs: {
        getURL: (p: string) => `asset://localhost/${p}`,
      } as any,
      appPlatform: 'tauri' as const,
      localBooksDir: '/Users/test/Yomi/Books',
    };

    const bookWithTimestamp = {
      hash: 'abc123hash',
      coverUpdatedAt: 1728300000000,
      format: 'EPUB',
    } as Book;

    const urlWithTimestamp = getCoverImageUrl(mockCtx, bookWithTimestamp);
    expect(urlWithTimestamp).toBe(
      'asset://localhost//Users/test/Yomi/Books/abc123hash/cover.png?v=1728300000000',
    );
  });

  it('returns plain url when neither coverHash nor coverUpdatedAt is set', () => {
    const mockCtx = {
      fs: {
        getURL: (p: string) => `asset://localhost/${p}`,
      } as any,
      appPlatform: 'tauri' as const,
      localBooksDir: '/Users/test/Yomi/Books',
    };

    const plainBook = {
      hash: 'abc123hash',
      format: 'EPUB',
    } as Book;

    const plainUrl = getCoverImageUrl(mockCtx, plainBook);
    expect(plainUrl).toBe('asset://localhost//Users/test/Yomi/Books/abc123hash/cover.png');
  });
});

import { describe, expect, it } from 'vitest';

import { getBookBiblophileQuery, getBiblophileSearchUrl } from '@/utils/biblophile';
import { Book } from '@/types/book';

const createBook = (overrides: Partial<Book> = {}): Book => ({
  hash: 'hash-1',
  format: 'EPUB',
  title: 'The Left Hand of Darkness',
  author: 'Ursula K. Le Guin',
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});

describe('getBiblophileSearchUrl', () => {
  it('builds a Biblophile search URL with the query percent-encoded', () => {
    expect(getBiblophileSearchUrl('The Left Hand of Darkness')).toBe(
      'https://biblophile.com/?search=The%20Left%20Hand%20of%20Darkness',
    );
  });

  it('trims surrounding whitespace before encoding', () => {
    expect(getBiblophileSearchUrl('  Dune  ')).toBe('https://biblophile.com/?search=Dune');
  });

  it('encodes reserved characters so the query survives intact', () => {
    expect(getBiblophileSearchUrl('Cat & Mouse')).toBe(
      'https://biblophile.com/?search=Cat%20%26%20Mouse',
    );
  });
});

describe('getBookBiblophileQuery', () => {
  it('combines title and author', () => {
    expect(getBookBiblophileQuery(createBook())).toBe(
      'The Left Hand of Darkness Ursula K. Le Guin',
    );
  });

  it('falls back to the title alone when the author is empty', () => {
    expect(getBookBiblophileQuery(createBook({ author: '' }))).toBe('The Left Hand of Darkness');
  });

  it('drops missing author entirely', () => {
    expect(getBookBiblophileQuery(createBook({ author: undefined }))).toBe(
      'The Left Hand of Darkness',
    );
  });

  it('trims stray whitespace from title and author', () => {
    expect(getBookBiblophileQuery(createBook({ title: '  Dune  ', author: '  Herbert ' }))).toBe(
      'Dune Herbert',
    );
  });
});

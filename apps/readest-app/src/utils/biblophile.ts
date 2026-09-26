import { Book } from '@/types/book';

export const BIBLOPHILE_BASE_URL = 'https://biblophile.com';

/** Build a Biblophile search URL for an arbitrary query string. */
export const getBiblophileSearchUrl = (query: string): string =>
  `${BIBLOPHILE_BASE_URL}/?search=${encodeURIComponent(query.trim())}`;

/**
 * Compose the Biblophile search query for a book from its title and author.
 * The author improves match precision; it's dropped when empty.
 */
export const getBookBiblophileQuery = (book: Pick<Book, 'title' | 'author'>): string =>
  [book.title, book.author]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

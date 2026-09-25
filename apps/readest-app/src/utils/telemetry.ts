import posthog from 'posthog-js';

export const TELEMETRY_OPT_OUT_KEY = 'readest-telemetry-opt-out';
export const TELEMETRY_DECISION_KEY = 'readest-telemetry-decision';

export type TelemetryDecision = 'opt-in' | 'opt-out' | 'pending';

/** Fraction of new users shown the consent prompt; the rest are opted out silently. */
export const TELEMETRY_PROMPT_BUCKET_RATE = 0.1;

export const hasOptedOutTelemetry = () => {
  return localStorage.getItem(TELEMETRY_OPT_OUT_KEY) === 'true';
};

export const getTelemetryDecision = (): TelemetryDecision | null => {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(TELEMETRY_DECISION_KEY);
  if (value === 'opt-in' || value === 'opt-out' || value === 'pending') return value;
  return null;
};

export const setTelemetryDecision = (decision: TelemetryDecision) => {
  localStorage.setItem(TELEMETRY_DECISION_KEY, decision);
};

/** Returns true with probability TELEMETRY_PROMPT_BUCKET_RATE. */
export const rollIntoTelemetryPromptBucket = (rng: () => number = Math.random) => {
  return rng() < TELEMETRY_PROMPT_BUCKET_RATE;
};

export const captureEvent = (event: string, properties?: Record<string, unknown>) => {
  if (!hasOptedOutTelemetry()) {
    posthog.capture(event, properties);
  }
};

export const trackReaderBookOpened = (book: {
  id?: string;
  title?: string;
  format?: string;
  author?: string;
}) => {
  captureEvent('reader_book_opened', {
    book_id: book.id,
    title: book.title,
    format: book.format,
    author: book.author,
  });
};

export const trackReadingProgress = (
  bookId: string,
  progressPercentage: number,
  currentPage?: number,
  totalPages?: number,
) => {
  captureEvent('reading_progress_updated', {
    book_id: bookId,
    progress_percentage: Math.round(progressPercentage * 100) / 100,
    current_page: currentPage,
    total_pages: totalPages,
  });
};

export const trackReaderFeatureUsed = (
  feature:
    | 'tts'
    | 'highlight'
    | 'note'
    | 'dictionary'
    | 'translation'
    | 'font_change'
    | 'theme_change'
    | 'search',
  details?: Record<string, unknown>,
) => {
  captureEvent('reader_feature_used', {
    feature_name: feature,
    ...details,
  });
};

export const trackYomiSignupClicked = (platform: string) => {
  captureEvent('yomi_signup_clicked', {
    from_platform: platform,
    source: 'yomi',
  });
};

export const optInTelemetry = () => {
  localStorage.setItem(TELEMETRY_OPT_OUT_KEY, 'false');
  setTelemetryDecision('opt-in');
  posthog.opt_in_capturing();
};
export const optOutTelemetry = () => {
  localStorage.setItem(TELEMETRY_OPT_OUT_KEY, 'true');
  setTelemetryDecision('opt-out');
  posthog.opt_out_capturing();
};

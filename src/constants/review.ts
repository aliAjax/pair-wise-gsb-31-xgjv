export const REVIEW_MIN_STARS = 1;
export const REVIEW_MAX_STARS = 5;

export const REVIEW_STAR_OPTIONS = [
  { label: '1 星', value: 1 },
  { label: '2 星', value: 2 },
  { label: '3 星', value: 3 },
  { label: '4 星', value: 4 },
  { label: '5 星', value: 5 },
];

export const REVIEW_CONTENT_MAX = 50;

export const CREDIT_RECALC_WINDOW = 5;
export const CREDIT_SCORE_PER_STAR = 20;

export const REVIEW_STORAGE_HINTS = {
  statusKey: 'reswap:reviews',
  statusTouchedBy: ['models/review.ts', 'stores/reviewStore.ts', 'components/common/ExchangeCard.vue'],
};

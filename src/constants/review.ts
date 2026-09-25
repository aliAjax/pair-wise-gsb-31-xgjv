export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

export const REVIEW_RATING_OPTIONS = [
  { label: '一星', value: 1 },
  { label: '两星', value: 2 },
  { label: '三星', value: 3 },
  { label: '四星', value: 4 },
  { label: '五星', value: 5 },
];

export const CREDIT_REVIEW_WINDOW = 5;
export const CREDIT_SCORE_PER_STAR = 20;

export const REVIEW_STORAGE_HINTS = {
  statusKey: 'reswap:reviews',
  statusTouchedBy: ['models/review.ts', 'stores/reviewStore.ts', 'components/common/ReviewPanel.vue'],
};

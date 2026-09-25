import { defineStore } from 'pinia';

import { reviewApi } from '@/api/reviewApi';
import { REVIEW_MESSAGES } from '@/constants/messages';
import type { Review, ReviewDraft } from '@/models/review';
import { useAuthStore } from '@/stores/authStore';
import { message } from '@/utils/message';
import { validateReviewDraft } from '@/utils/validators';

export const useReviewStore = defineStore('reviews', {
  state: () => ({
    reviews: [] as Review[],
    hydrated: false,
    loading: false,
  }),
  getters: {
    byExchange: (state) => (exchangeId: string) =>
      state.reviews.filter((item) => item.exchange_id === exchangeId),
    receivedBy: (state) => (userId: string) =>
      state.reviews.filter((item) => item.to_user_id === userId),
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.reviews = await reviewApi.list();
        this.hydrated = true;
      } finally {
        this.loading = false;
      }
    },
    async submit(draft: ReviewDraft) {
      const error = validateReviewDraft(draft);
      if (error) {
        message(error, 'error');
        return;
      }
      try {
        const { pairCompleted } = await reviewApi.create(draft);
        this.reviews = await reviewApi.list();
        const authStore = useAuthStore();
        await authStore.refreshUsers();
        message(pairCompleted ? REVIEW_MESSAGES.pairCompleted : REVIEW_MESSAGES.submitted, 'success');
      } catch (submitError) {
        message(submitError instanceof Error ? submitError.message : REVIEW_MESSAGES.submitFailed, 'error');
      }
    },
  },
});

import { defineStore } from 'pinia';

import { reviewApi } from '@/api/reviewApi';
import { PAGE_MESSAGES } from '@/constants/messages';
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
    receivedBy: (state) => (userId: string) => state.reviews.filter((item) => item.to_user_id === userId),
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
        return null;
      }
      try {
        const result = await reviewApi.submit(draft);
        this.reviews = await reviewApi.list();
        if (result.bothReviewed) {
          // 信用分已重算，刷新用户数据让个人页、物品详情、交换记录同步信用等级
          const authStore = useAuthStore();
          await authStore.hydrate();
          message(PAGE_MESSAGES.reviewPublished, 'success');
        } else {
          message(PAGE_MESSAGES.reviewWaiting, 'success');
        }
        return result.review;
      } catch (error) {
        message(error instanceof Error ? error.message : '评价提交失败', 'error');
        return null;
      }
    },
  },
});

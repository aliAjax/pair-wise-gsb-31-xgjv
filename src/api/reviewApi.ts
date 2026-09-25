import { ExchangeStatus } from '@/constants/exchange';
import { CREDIT_REVIEW_WINDOW, CREDIT_SCORE_PER_STAR } from '@/constants/review';
import type { Review, ReviewDraft } from '@/models/review';

import { exchangeApi } from './exchangeApi';
import { userApi } from './userApi';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export interface ReviewSubmitResult {
  review: Review;
  bothReviewed: boolean;
}

export const reviewApi = {
  async list(): Promise<Review[]> {
    return storage.get<Review[]>(STORAGE_KEYS.reviews, []);
  },

  async listByExchange(exchangeId: string): Promise<Review[]> {
    const reviews = await this.list();
    return reviews.filter((review) => review.exchange_id === exchangeId);
  },

  async submit(draft: ReviewDraft): Promise<ReviewSubmitResult> {
    const exchange = await exchangeApi.detail(draft.exchange_id);
    if (!exchange) throw new Error('交换请求不存在');
    if (exchange.status !== ExchangeStatus.COMPLETED) {
      throw new Error('交换完成后才能评价');
    }
    const participants = [exchange.from_user_id, exchange.to_user_id];
    const counterpart = participants.find((userId) => userId !== draft.from_user_id);
    if (!participants.includes(draft.from_user_id) || draft.to_user_id !== counterpart) {
      throw new Error('只有交换双方可以互相评价');
    }

    const reviews = await this.list();
    const duplicated = reviews.some(
      (item) => item.exchange_id === draft.exchange_id && item.from_user_id === draft.from_user_id,
    );
    if (duplicated) {
      throw new Error('这条交换你已经评价过了，提交后不能修改');
    }

    const review: Review = {
      ...draft,
      id: storage.createId('review'),
      created_at: new Date().toISOString(),
    };
    const nextReviews = [review, ...reviews];
    await storage.set(STORAGE_KEYS.reviews, nextReviews);

    const exchangeReviews = nextReviews.filter((item) => item.exchange_id === draft.exchange_id);
    const bothReviewed = participants.every((userId) =>
      exchangeReviews.some((item) => item.from_user_id === userId),
    );
    if (bothReviewed) {
      // 双方评价齐全后重算信用分，只动用户信用，不回写已完成物品的状态
      await this.recalculateCredit(exchange.from_user_id, nextReviews);
      await this.recalculateCredit(exchange.to_user_id, nextReviews);
    }
    return { review, bothReviewed };
  },

  async recalculateCredit(userId: string, allReviews?: Review[]): Promise<void> {
    const reviews = (allReviews ?? (await this.list()))
      .filter((item) => item.to_user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, CREDIT_REVIEW_WINDOW);
    if (!reviews.length) return;
    const average = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
    await userApi.setCreditScore(userId, Math.round(average * CREDIT_SCORE_PER_STAR));
  },
};

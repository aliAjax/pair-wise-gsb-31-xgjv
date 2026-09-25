import { ExchangeStatus } from '@/constants/exchange';
import { REVIEW_MESSAGES } from '@/constants/messages';
import {
  CREDIT_RECALC_WINDOW,
  CREDIT_SCORE_PER_STAR,
  REVIEW_MAX_STARS,
  REVIEW_MIN_STARS,
} from '@/constants/review';
import type { Review, ReviewDraft } from '@/models/review';

import { exchangeApi } from './exchangeApi';
import { userApi } from './userApi';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export const reviewApi = {
  async list(): Promise<Review[]> {
    return storage.get<Review[]>(STORAGE_KEYS.reviews, []);
  },

  async listByExchange(exchangeId: string): Promise<Review[]> {
    const reviews = await this.list();
    return reviews.filter((item) => item.exchange_id === exchangeId);
  },

  async create(draft: ReviewDraft): Promise<{ review: Review; pairCompleted: boolean }> {
    const exchanges = await exchangeApi.list();
    const exchange = exchanges.find((item) => item.id === draft.exchange_id);
    if (!exchange || exchange.status !== ExchangeStatus.COMPLETED) {
      throw new Error(REVIEW_MESSAGES.onlyCompleted);
    }
    const participants = [exchange.from_user_id, exchange.to_user_id];
    if (
      draft.from_user_id === draft.to_user_id ||
      !participants.includes(draft.from_user_id) ||
      !participants.includes(draft.to_user_id)
    ) {
      throw new Error(REVIEW_MESSAGES.onlyParticipants);
    }
    if (draft.stars < REVIEW_MIN_STARS || draft.stars > REVIEW_MAX_STARS) {
      throw new Error(REVIEW_MESSAGES.invalidStars);
    }
    const reviews = await this.list();
    const duplicated = reviews.some(
      (item) => item.exchange_id === draft.exchange_id && item.from_user_id === draft.from_user_id,
    );
    if (duplicated) {
      throw new Error(REVIEW_MESSAGES.onlyOnce);
    }

    const review: Review = {
      ...draft,
      content: draft.content.trim(),
      id: storage.createId('review'),
      created_at: new Date().toISOString(),
    };
    const nextReviews = [review, ...reviews];
    await storage.set(STORAGE_KEYS.reviews, nextReviews);

    const pair = nextReviews.filter((item) => item.exchange_id === draft.exchange_id);
    const pairCompleted = pair.length >= 2;
    if (pairCompleted) {
      await this.recalculateCredit([exchange.from_user_id, exchange.to_user_id], nextReviews);
    }
    return { review, pairCompleted };
  },

  async recalculateCredit(userIds: string[], reviews?: Review[]): Promise<void> {
    const allReviews = reviews ?? (await this.list());
    const scores: Record<string, number> = {};
    userIds.forEach((userId) => {
      const received = allReviews
        .filter((item) => item.to_user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, CREDIT_RECALC_WINDOW);
      if (!received.length) return;
      const total = received.reduce((sum, item) => sum + item.stars, 0);
      scores[userId] = Math.round((total / received.length) * CREDIT_SCORE_PER_STAR);
    });
    await userApi.applyCreditScores(scores);
  },
};

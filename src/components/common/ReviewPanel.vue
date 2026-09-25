<template>
  <section v-if="visible" class="review-panel">
    <template v-if="bothReviewed && myReview && theirReview">
      <div class="review-panel__item">
        <header>
          <strong>对方给你的评价</strong>
          <span class="review-panel__stars">
            <van-rate :model-value="theirReview.rating" readonly size="14" color="var(--rs-accent)" />
            <small>{{ formatRating(theirReview.rating) }}</small>
          </span>
        </header>
        <p>{{ theirReview.comment }}</p>
        <small>{{ nicknameOf(theirReview.from_user_id) }} · {{ formatDate(theirReview.created_at) }}</small>
      </div>
      <div class="review-panel__item">
        <header>
          <strong>你给对方的评价</strong>
          <span class="review-panel__stars">
            <van-rate :model-value="myReview.rating" readonly size="14" color="var(--rs-accent)" />
            <small>{{ formatRating(myReview.rating) }}</small>
          </span>
        </header>
        <p>{{ myReview.comment }}</p>
        <small>{{ formatDate(myReview.created_at) }}</small>
      </div>
    </template>

    <p v-else-if="myReview" class="review-panel__waiting">{{ PAGE_MESSAGES.reviewWaiting }}</p>

    <form v-else class="review-panel__form" @submit.prevent="submit">
      <label>
        给对方打个分
        <van-rate v-model="rating" :count="REVIEW_MAX_RATING" color="var(--rs-accent)" />
      </label>
      <label>
        一句实际表现
        <textarea v-model="comment" rows="2" maxlength="80" placeholder="例如：准时赴约，物品和描述一致" />
      </label>
      <button class="primary-button" type="submit">提交评价</button>
      <small class="form-note">每条交换只能评价一次，提交后不可修改；双方提交后互相可见</small>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Rate as VanRate } from 'vant';

import { ExchangeStatus } from '@/constants/exchange';
import { PAGE_MESSAGES } from '@/constants/messages';
import { REVIEW_MAX_RATING } from '@/constants/review';
import type { Exchange } from '@/models/exchange';
import type { User } from '@/models/user';
import { useAuthStore } from '@/stores/authStore';
import { useReviewStore } from '@/stores/reviewStore';
import { formatDate, formatRating } from '@/utils/formatters';

const props = defineProps<{
  exchange: Exchange;
  users: User[];
}>();

const authStore = useAuthStore();
const reviewStore = useReviewStore();

const rating = ref(0);
const comment = ref('');

const isParticipant = computed(() =>
  [props.exchange.from_user_id, props.exchange.to_user_id].includes(authStore.currentUser?.id ?? ''),
);
const visible = computed(() => props.exchange.status === ExchangeStatus.COMPLETED && isParticipant.value);

const exchangeReviews = computed(() => reviewStore.byExchange(props.exchange.id));
const myReview = computed(() =>
  exchangeReviews.value.find((item) => item.from_user_id === authStore.currentUser?.id),
);
const theirReview = computed(() =>
  exchangeReviews.value.find((item) => item.from_user_id !== authStore.currentUser?.id),
);
const bothReviewed = computed(() => Boolean(myReview.value && theirReview.value));

const nicknameOf = (userId: string) => props.users.find((user) => user.id === userId)?.nickname ?? '对方';

const submit = async () => {
  if (!authStore.currentUser) return;
  const counterpart =
    props.exchange.from_user_id === authStore.currentUser.id
      ? props.exchange.to_user_id
      : props.exchange.from_user_id;
  const review = await reviewStore.submit({
    exchange_id: props.exchange.id,
    from_user_id: authStore.currentUser.id,
    to_user_id: counterpart,
    rating: rating.value,
    comment: comment.value.trim(),
  });
  if (review) {
    rating.value = 0;
    comment.value = '';
  }
};
</script>

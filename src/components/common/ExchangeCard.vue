<template>
  <article class="exchange-card">
    <header>
      <span class="status-pill" :class="statusToneClass(exchange.status)">
        {{ formatExchangeStatus(exchange.status) }}
      </span>
      <small>{{ formatDate(exchange.updated_at) }}</small>
    </header>
    <div class="exchange-card__items">
      <div>
        <span>拿出</span>
        <strong>{{ fromItem?.title ?? '未知物品' }}</strong>
      </div>
      <div>
        <span>换取</span>
        <strong>{{ toItem?.title ?? '未知物品' }}</strong>
      </div>
    </div>
    <p>{{ exchange.message || formatStatusMessage(exchange.status) }}</p>
    <footer>
      <span v-if="fromUser && toUser">
        {{ fromUser.nickname }}（{{ formatCreditLevel(fromUser.credit_score) }}） →
        {{ toUser.nickname }}（{{ formatCreditLevel(toUser.credit_score) }}）
      </span>
      <div v-if="canOperate" class="exchange-card__actions">
        <button v-if="exchange.status === ExchangeStatus.PENDING" type="button" @click="$emit('accept', exchange.id)">
          同意
        </button>
        <button v-if="exchange.status === ExchangeStatus.PENDING" type="button" @click="$emit('reject', exchange.id)">
          拒绝
        </button>
        <button v-if="exchange.status === ExchangeStatus.ACCEPTED" type="button" @click="$emit('complete', exchange.id)">
          完成
        </button>
      </div>
    </footer>

    <section v-if="canReview" class="review-box">
      <template v-if="bothReviewed">
        <div v-for="review in exchangeReviews" :key="review.id" class="review-item">
          <div class="review-item__head">
            <strong>{{ reviewerName(review.from_user_id) }}</strong>
            <span class="review-stars">{{ formatStars(review.stars) }}</span>
          </div>
          <p>{{ review.content }}</p>
        </div>
      </template>
      <p v-else-if="myReview" class="review-waiting">{{ REVIEW_MESSAGES.waitingPeer }}</p>
      <form v-else class="review-form" @submit.prevent="submitReview">
        <div class="review-form__stars">
          <button
            v-for="option in REVIEW_STAR_OPTIONS"
            :key="option.value"
            type="button"
            :class="{ active: option.value <= draftStars }"
            :title="option.label"
            @click="draftStars = option.value"
          >
            ★
          </button>
        </div>
        <textarea
          v-model="draftContent"
          rows="2"
          :maxlength="REVIEW_CONTENT_MAX"
          :placeholder="REVIEW_MESSAGES.requiredContent"
        />
        <button class="primary-button" type="submit">提交评价</button>
      </form>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { ExchangeStatus } from '@/constants/exchange';
import { REVIEW_MESSAGES } from '@/constants/messages';
import { REVIEW_CONTENT_MAX, REVIEW_STAR_OPTIONS } from '@/constants/review';
import type { Exchange } from '@/models/exchange';
import type { Item } from '@/models/item';
import type { Review, ReviewDraft } from '@/models/review';
import type { User } from '@/models/user';
import { useAuthStore } from '@/stores/authStore';
import {
  formatCreditLevel,
  formatDate,
  formatExchangeStatus,
  formatStars,
  formatStatusMessage,
  statusToneClass,
} from '@/utils/formatters';

const props = defineProps<{
  exchange: Exchange;
  items: Item[];
  users: User[];
  reviews: Review[];
}>();

const emit = defineEmits<{
  accept: [id: string];
  reject: [id: string];
  complete: [id: string];
  review: [draft: ReviewDraft];
}>();

const authStore = useAuthStore();
const fromItem = computed(() => props.items.find((item) => item.id === props.exchange.from_item_id));
const toItem = computed(() => props.items.find((item) => item.id === props.exchange.to_item_id));
const fromUser = computed(() => props.users.find((user) => user.id === props.exchange.from_user_id));
const toUser = computed(() => props.users.find((user) => user.id === props.exchange.to_user_id));
const canOperate = computed(
  () =>
    authStore.currentUser?.id === props.exchange.to_user_id ||
    (authStore.currentUser?.id === props.exchange.from_user_id && props.exchange.status === ExchangeStatus.ACCEPTED),
);

const exchangeReviews = computed(() =>
  props.reviews.filter((review) => review.exchange_id === props.exchange.id),
);
const myReview = computed(() =>
  exchangeReviews.value.find((review) => review.from_user_id === authStore.currentUser?.id),
);
const bothReviewed = computed(() => exchangeReviews.value.length >= 2);
const isParticipant = computed(() =>
  [props.exchange.from_user_id, props.exchange.to_user_id].includes(authStore.currentUser?.id ?? ''),
);
const canReview = computed(
  () => props.exchange.status === ExchangeStatus.COMPLETED && isParticipant.value,
);

const draftStars = ref(0);
const draftContent = ref('');
const peerId = computed(() =>
  authStore.currentUser?.id === props.exchange.from_user_id
    ? props.exchange.to_user_id
    : props.exchange.from_user_id,
);

const reviewerName = (userId: string) =>
  props.users.find((user) => user.id === userId)?.nickname ?? '未知用户';

const submitReview = () => {
  if (!authStore.currentUser) return;
  emit('review', {
    exchange_id: props.exchange.id,
    from_user_id: authStore.currentUser.id,
    to_user_id: peerId.value,
    stars: draftStars.value,
    content: draftContent.value.trim(),
  });
};
</script>

import type { ItemDraft } from '@/models/item';
import type { ReviewDraft } from '@/models/review';
import type { UserDraft } from '@/models/user';

import { FORM_MESSAGES } from '@/constants/messages';
import { REVIEW_MAX_RATING, REVIEW_MIN_RATING } from '@/constants/review';

export const validateItemDraft = (draft: Partial<ItemDraft>) => {
  if (!draft.title?.trim()) return FORM_MESSAGES.requiredTitle;
  if (!draft.description?.trim()) return FORM_MESSAGES.requiredDescription;
  return '';
};

export const validateUserDraft = (draft: Partial<UserDraft>) => {
  if (!draft.nickname?.trim()) return '昵称不能为空';
  if (!draft.phone?.trim()) return FORM_MESSAGES.requiredPhone;
  return '';
};

export const validateReviewDraft = (draft: Partial<ReviewDraft>) => {
  if (!draft.rating || draft.rating < REVIEW_MIN_RATING || draft.rating > REVIEW_MAX_RATING) {
    return FORM_MESSAGES.requiredRating;
  }
  if (!draft.comment?.trim()) return FORM_MESSAGES.requiredReviewComment;
  return '';
};

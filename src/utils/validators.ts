import type { ItemDraft } from '@/models/item';
import type { ReviewDraft } from '@/models/review';
import type { UserDraft } from '@/models/user';

import { FORM_MESSAGES, REVIEW_MESSAGES } from '@/constants/messages';
import { REVIEW_MAX_STARS, REVIEW_MIN_STARS } from '@/constants/review';

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
  if (!draft.stars || draft.stars < REVIEW_MIN_STARS || draft.stars > REVIEW_MAX_STARS) {
    return REVIEW_MESSAGES.invalidStars;
  }
  if (!draft.content?.trim()) return REVIEW_MESSAGES.requiredContent;
  return '';
};

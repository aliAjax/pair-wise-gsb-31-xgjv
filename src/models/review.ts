export interface Review {
  id: string;
  exchange_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type ReviewDraft = Omit<Review, 'id' | 'created_at'>;

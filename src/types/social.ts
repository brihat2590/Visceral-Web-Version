export interface Post {
  id: string;
  user_id?: string;
  title: string;
  post: string;
  source?: string;
  created_at: string;
  image_url?: string;
  upvotes?: number;
  downvotes?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface ByUsComment {
  id: string;
  by_us_id: string;
  user_id?: string | null;
  commenter_email?: string | null; // resolved client-side
  comment: string;
  created_at: string;
}
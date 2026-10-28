export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  sender?: {
    id: string;
    name: string;
    profile_image_url?: string | null;
  };
  receiver?: {
    id: string;
    name: string;
    profile_image_url?: string | null;
  };
};

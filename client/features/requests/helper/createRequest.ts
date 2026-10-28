import type { Request, RequestType } from '../data/types';

export function createRequest(params: {
  requesterId: string;
  receiverId: string;
  subject: string;
  type: RequestType; // 'REQUEST' | 'OFFER'
}): Request {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    requester_id: params.requesterId,
    receiver_id: params.receiverId,
    subject: params.subject.trim() || 'General',
    scheduled_datetime: '', // keep empty for now
    status: 'PENDING',
    created_at: now,
    type: params.type,
    requester_completed: false,
    receiver_completed: false,
  };
}

import { fetchUserSessions, updateSessionDatetime } from '@/features/studySessions/api/studySessionsApi';
import * as client from '@/shared/api/client';
import * as authStore from '@/shared/store/auth';

jest.mock('@/shared/api/client');
jest.mock('@/shared/store/auth');

const mockApiFetch = client.apiFetch as jest.Mock;
const mockGetLoggedInUserId = authStore.getLoggedInUserId as jest.Mock;
const mockGetAccessToken = authStore.getAccessToken as jest.Mock;

describe('studySessionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLoggedInUserId.mockReturnValue('user-1');
    mockGetAccessToken.mockReturnValue('token-1');
  });

  describe('fetchUserSessions', () => {
    it('throws when user is not authenticated', async () => {
      mockGetLoggedInUserId.mockReturnValue(null);

      await expect(fetchUserSessions()).rejects.toThrow('Not authenticated');
    });

    it('returns raw array response', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 's1' }, { id: 's2' }],
      });

      const result = await fetchUserSessions();

      expect(result).toEqual([{ id: 's1' }, { id: 's2' }]);
      expect(mockApiFetch).toHaveBeenCalledWith('/users/user-1/sessions');
    });

    it('unwraps sessions from data wrapper', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 's1', request_id: 'r1' }] }),
      });

      const result = await fetchUserSessions();

      expect(result).toEqual([{ id: 's1', request_id: 'r1' }]);
    });

    it('throws on non-ok response', async () => {
      mockApiFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchUserSessions()).rejects.toThrow('Failed to load sessions (500)');
    });
  });

  describe('updateSessionDatetime', () => {
    it('throws when token is missing', async () => {
      mockGetAccessToken.mockReturnValue(null);

      await expect(updateSessionDatetime('s1', '2026-04-05T10:00:00.000Z')).rejects.toThrow('Not authenticated');
    });

    it('returns nested session object', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          session: {
            id: 's1',
            scheduled_datetime: '2026-04-05T10:00:00.000Z',
          },
        }),
      });

      const result = await updateSessionDatetime('s1', '2026-04-05T10:00:00.000Z');

      expect(result).toEqual({
        id: 's1',
        scheduled_datetime: '2026-04-05T10:00:00.000Z',
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/users/user-1/sessions/s1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            scheduled_datetime: '2026-04-05T10:00:00.000Z',
          }),
        }),
      );
    });

    it('returns direct object with id', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 's2',
          scheduled_datetime: '2026-04-06T10:00:00.000Z',
        }),
      });

      const result = await updateSessionDatetime('s2', '2026-04-06T10:00:00.000Z');

      expect(result.id).toBe('s2');
    });

    it('throws detailed backend error', async () => {
      mockApiFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'bad datetime',
      });

      await expect(updateSessionDatetime('s1', 'bad')).rejects.toThrow('Failed to update session (400): bad datetime');
    });

    it('throws when response body does not contain a session', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nope: true }),
      });

      await expect(updateSessionDatetime('s1', '2026-04-05T10:00:00.000Z')).rejects.toThrow(
        'Invalid session data from server',
      );
    });
  });
});

import { mapApiUserToUser, fetchHomeUsers, fetchUserById, submitUserRating } from '@/features/users/api/homeUsers';
import * as client from '@/shared/api/client';
import * as authStore from '@/shared/store/auth';
import * as userCache from '@/features/users/store/userProfileCache';

jest.mock('@/shared/api/client');
jest.mock('@/shared/store/auth');
jest.mock('@/features/users/store/userProfileCache');

const mockApiFetch = client.apiFetch as jest.Mock;
const mockGetAccessToken = authStore.getAccessToken as jest.Mock;
const mockGetCachedUsersList = userCache.getCachedUsersList as jest.Mock;
const mockSetCachedUsersList = userCache.setCachedUsersList as jest.Mock;
const mockGetCachedUserProfile = userCache.getCachedUserProfile as jest.Mock;
const mockSetCachedUserProfile = userCache.setCachedUserProfile as jest.Mock;

describe('homeUsers api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockReturnValue('token-123');
    mockGetCachedUsersList.mockReturnValue(null);
    mockGetCachedUserProfile.mockReturnValue(null);
  });

  describe('mapApiUserToUser', () => {
    it('maps valid backend user shape', () => {
      const result = mapApiUserToUser({
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        major: 'ICT',
        education_level: 'WO',
        strengths: ['React'],
        needs_help_with: ['Math'],
        description: 'hello',
        token_balance: '7',
        rating_average: '4',
        rating_count: '2',
        created_at: '2026-04-04T00:00:00.000Z',
        profile_image_url: 'https://img.test/a.png',
        is_paused: 'true',
      });

      expect(result).toEqual({
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        password: '',
        major: 'ICT',
        education_level: 'WO',
        strengths: ['React'],
        needs_help_with: ['Math'],
        description: 'hello',
        token_balance: 7,
        rating_average: 4,
        rating_count: 2,
        created_at: '2026-04-04T00:00:00.000Z',
        profile_image_url: 'https://img.test/a.png',
        isPaused: true,
      });
    });

    it('returns null for invalid input or missing id', () => {
      expect(mapApiUserToUser(null)).toBeNull();
      expect(mapApiUserToUser({})).toBeNull();
    });

    it('falls back to defaults for malformed fields', () => {
      const result = mapApiUserToUser({
        id: 'u2',
        name: null,
        education_level: 'invalid',
        strengths: 'not-array',
        needsHelpWith: ['History'],
        tokenBalance: 'abc',
        isPaused: 0,
      });

      expect(result).toMatchObject({
        id: 'u2',
        name: 'Unknown',
        education_level: 'HBO',
        strengths: [],
        needs_help_with: ['History'],
        token_balance: 0,
        isPaused: false,
      });
      expect(result?.profile_image_url).toContain('via.placeholder.com');
    });
  });

  describe('fetchHomeUsers', () => {
    it('returns fresh cached users without calling backend', async () => {
      const cachedUsers = [
        {
          id: 'u1',
          name: 'Cached',
          email: 'cached@test.com',
          password: '',
          major: 'ICT',
          education_level: 'HBO',
          strengths: [],
          needs_help_with: [],
          token_balance: 0,
          created_at: '2026-04-04T00:00:00.000Z',
          cachedAt: Date.now(),
          source: 'network' as const,
        },
      ];

      mockGetCachedUsersList.mockReturnValue({
        users: cachedUsers,
        cachedAt: Date.now(),
      });

      const result = await fetchHomeUsers();

      expect(result).toEqual(cachedUsers);
      expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('fetches, maps, and caches users from backend', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            {
              id: 'u1',
              name: 'Alice',
              email: 'alice@test.com',
              major: 'ICT',
              education_level: 'HBO',
              strengths: ['React'],
              needs_help_with: ['Math'],
              token_balance: 5,
              created_at: '2026-04-04T00:00:00.000Z',
            },
            { bad: 'row' },
          ],
        }),
      });

      const result = await fetchHomeUsers();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'u1',
        name: 'Alice',
        token_balance: 5,
      });
      expect(mockSetCachedUsersList).toHaveBeenCalledTimes(1);
    });

    it('returns stale cache when backend fetch fails', async () => {
      const cachedUsers = [
        {
          id: 'u1',
          name: 'Fallback',
          email: 'fallback@test.com',
          password: '',
          major: 'ICT',
          education_level: 'HBO',
          strengths: [],
          needs_help_with: [],
          token_balance: 0,
          created_at: '2026-04-04T00:00:00.000Z',
          cachedAt: Date.now() - 10 * 60 * 1000,
          source: 'cache' as const,
        },
      ];

      mockGetCachedUsersList
        .mockReturnValueOnce({
          users: cachedUsers,
          cachedAt: Date.now() - 10 * 60 * 1000,
        })
        .mockReturnValueOnce({
          users: cachedUsers,
          cachedAt: Date.now() - 10 * 60 * 1000,
        });

      mockApiFetch.mockRejectedValue(new Error('network down'));

      const result = await fetchHomeUsers();

      expect(result).toEqual(cachedUsers);
    });
  });

  describe('fetchUserById', () => {
    it('returns cached profile when available', async () => {
      mockGetCachedUserProfile.mockReturnValue({
        id: 'u1',
        name: 'Cached User',
        email: 'cached@test.com',
        password: '',
        major: 'ICT',
        education_level: 'HBO',
        strengths: [],
        needs_help_with: [],
        token_balance: 0,
        created_at: '2026-04-04T00:00:00.000Z',
      });

      const result = await fetchUserById('u1');

      expect(result.name).toBe('Cached User');
      expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('unwraps nested user payload and caches it', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'u2',
            name: 'Nested User',
            email: 'nested@test.com',
            major: 'ICT',
            educationLevel: 'Master HBO',
            strengths: ['Node'],
            needsHelpWith: ['UX'],
            tokenBalance: 3,
            createdAt: '2026-04-04T00:00:00.000Z',
          },
        }),
      });

      const result = await fetchUserById('u2');

      expect(result).toMatchObject({
        id: 'u2',
        name: 'Nested User',
        education_level: 'Master HBO',
        needs_help_with: ['UX'],
        token_balance: 3,
      });
      expect(mockSetCachedUserProfile).toHaveBeenCalledTimes(1);
    });

    it('throws when backend returns invalid user and no cache exists', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: { name: 'Missing id' } }),
      });

      await expect(fetchUserById('u3')).rejects.toThrow('Invalid user data from server');
    });
  });

  describe('submitUserRating', () => {
    it('throws when not authenticated', async () => {
      mockGetAccessToken.mockReturnValue(null);

      await expect(
        submitUserRating('u1', {
          study_session_id: 's1',
          ratee_id: 'u2',
          stars: 5,
        }),
      ).rejects.toThrow('Not authenticated');
    });

    it('returns parsed json on success', async () => {
      mockApiFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ id: 'rating-1', stars: 5 }),
      });

      const result = await submitUserRating('u1', {
        study_session_id: 's1',
        ratee_id: 'u2',
        stars: 5,
      });

      expect(result).toEqual({ id: 'rating-1', stars: 5 });
    });

    it('parses backend error message on failure', async () => {
      mockApiFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: ['Stars must be between 0 and 5'] }),
      });

      await expect(
        submitUserRating('u1', {
          study_session_id: 's1',
          ratee_id: 'u2',
          stars: 9,
        }),
      ).rejects.toThrow('Failed to submit rating (400): Stars must be between 0 and 5');
    });
  });
});

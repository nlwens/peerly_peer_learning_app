import AsyncStorage from '@react-native-async-storage/async-storage';
import * as requestsStore from '@/features/requests/store/requestsStore';
import * as client from '@/shared/api/client';
import * as authStore from '@/shared/store/auth';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/shared/api/client');
jest.mock('@/shared/store/auth');

const mockApiFetch = client.apiFetch as jest.Mock;
const mockGetLoggedInUserId = authStore.getLoggedInUserId as jest.Mock;
const mockGetAccessToken = authStore.getAccessToken as jest.Mock;

describe('requestsStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetLoggedInUserId.mockReturnValue('user-1');
    mockGetAccessToken.mockReturnValue(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    await requestsStore.replaceRequests([]);
  });

  it('setRequestStatus updates local state when offline', async () => {
    await requestsStore.replaceRequests([
      {
        id: 'r1',
        requester_id: 'user-1',
        receiver_id: 'user-2',
        subject: 'Math',
        scheduled_datetime: '',
        status: 'PENDING',
        created_at: '2026-04-04T00:00:00.000Z',
        type: 'REQUEST',
      },
    ]);

    await requestsStore.setRequestStatus('r1', 'DECLINED');

    expect(requestsStore.findRequest('r1')?.status).toBe('DECLINED');
  });

  it('hasPendingBetween works in both directions and can filter by type', async () => {
    await requestsStore.replaceRequests([
      {
        id: 'r1',
        requester_id: 'user-1',
        receiver_id: 'user-2',
        subject: 'Math',
        scheduled_datetime: '',
        status: 'PENDING',
        created_at: '2026-04-04T00:00:00.000Z',
        type: 'REQUEST',
      },
      {
        id: 'r2',
        requester_id: 'user-3',
        receiver_id: 'user-1',
        subject: 'Physics',
        scheduled_datetime: '',
        status: 'ACCEPTED',
        created_at: '2026-04-04T00:00:00.000Z',
        type: 'OFFER',
      },
    ]);

    expect(requestsStore.hasPendingBetween('user-1', 'user-2')).toBe(true);
    expect(requestsStore.hasPendingBetween('user-2', 'user-1')).toBe(true);
    expect(requestsStore.hasPendingBetween('user-1', 'user-2', 'REQUEST')).toBe(true);
    expect(requestsStore.hasPendingBetween('user-1', 'user-2', 'OFFER')).toBe(false);
  });

  it('setRequestSchedule updates scheduled datetime locally', async () => {
    await requestsStore.replaceRequests([
      {
        id: 'r1',
        requester_id: 'user-1',
        receiver_id: 'user-2',
        subject: 'Math',
        scheduled_datetime: '',
        status: 'PENDING',
        created_at: '2026-04-04T00:00:00.000Z',
        type: 'REQUEST',
      },
    ]);

    await requestsStore.setRequestSchedule('r1', '2026-04-10T10:00:00.000Z');

    expect(requestsStore.findRequest('r1')?.scheduled_datetime).toBe('2026-04-10T10:00:00.000Z');
  });

  it('completeSessionOnBackend completes locally when only local user id exists', async () => {
    mockGetLoggedInUserId.mockReturnValue('user-1');
    mockGetAccessToken.mockReturnValue(null);

    await requestsStore.replaceRequests([
      {
        id: 'r1',
        requester_id: 'user-1',
        receiver_id: 'user-2',
        subject: 'Math',
        scheduled_datetime: '',
        status: 'ACCEPTED',
        created_at: '2026-04-04T00:00:00.000Z',
        type: 'REQUEST',
        requester_completed: false,
        receiver_completed: true,
      },
    ]);

    await requestsStore.completeSessionOnBackend('r1');

    expect(requestsStore.findRequest('r1')).toMatchObject({
      requester_completed: true,
      receiver_completed: true,
      status: 'COMPLETED',
    });
  });

  it('loadRequests falls back to cached storage when backend is unavailable', async () => {
    mockGetLoggedInUserId.mockReturnValue('user-1');
    mockGetAccessToken.mockReturnValue('token-1');
    mockApiFetch.mockRejectedValue(new Error('network down'));

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([
        {
          id: 'r1',
          requester_id: 'user-1',
          receiver_id: 'user-2',
          subject: 'Cached request',
          scheduled_datetime: '',
          status: 'PENDING',
          created_at: '2026-04-04T00:00:00.000Z',
          type: 'REQUEST',
        },
      ]),
    );

    await requestsStore.loadRequests();

    expect(requestsStore.findRequest('r1')?.subject).toBe('Cached request');
  });

  it('loadRequests resets invalid cached JSON', async () => {
    mockGetLoggedInUserId.mockReturnValue(null);
    mockGetAccessToken.mockReturnValue(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json');

    await requestsStore.loadRequests();

    expect(requestsStore.findRequest('r1')).toBeUndefined();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('peerly_requests');
  });

  it("createRequestOnBackend maps backend 'out of tokens' to friendly error", async () => {
    mockGetAccessToken.mockReturnValue('token-1');
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "You're out of tokens!" }),
    });

    await expect(
      requestsStore.createRequestOnBackend({
        requesterId: 'user-1',
        receiverId: 'user-2',
        subject: 'Math',
        type: 'REQUEST',
      }),
    ).rejects.toThrow("You're out of tokens!");
  });

  it('findStudySessionIdByRequest returns nested linked session id', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 's1', request_id: 'r1' },
          { id: 's2', requests: { id: 'r2' } },
        ],
      }),
    });

    await expect(requestsStore.findStudySessionIdByRequest('user-1', 'r2')).resolves.toBe('s2');
    await expect(requestsStore.findStudySessionIdByRequest('user-1', 'missing')).resolves.toBeNull();
  });
});

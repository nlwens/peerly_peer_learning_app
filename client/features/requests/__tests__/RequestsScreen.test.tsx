import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RequestsScreen from '@/features/requests/screens/RequestsScreen';
import * as requestStore from '@/features/requests/store/requestsStore';
import * as authStore from '@/shared/store/auth';

jest.mock('@/features/requests/store/requestsStore');
jest.mock('@/shared/store/auth');

const mockRequests = [
  {
    id: 'req-1',
    subject: 'Math Help',
    requester_id: 'user-1',
    receiver_id: 'current-user',
    status: 'PENDING',
    created_at: '2024-01-01',
  },
  {
    id: 'req-2',
    subject: 'Physics Help',
    requester_id: 'current-user',
    receiver_id: 'user-2',
    status: 'PENDING',
    created_at: '2024-01-02',
  },
  {
    id: 'req-3',
    subject: 'Chemistry Session',
    requester_id: 'user-1',
    receiver_id: 'current-user',
    status: 'ACCEPTED',
    created_at: '2024-01-03',
  },
  {
    id: 'req-4',
    subject: 'History Help',
    requester_id: 'current-user',
    receiver_id: 'user-3',
    status: 'COMPLETED',
    created_at: '2024-01-04',
  },
  {
    id: 'req-5',
    subject: 'Biology Help',
    requester_id: 'user-4',
    receiver_id: 'current-user',
    status: 'DECLINED',
    created_at: '2024-01-05',
  },
];

describe('RequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requestStore.useRequests as jest.Mock).mockReturnValue(mockRequests);
    (authStore.getLoggedInUserId as jest.Mock).mockReturnValue('current-user');
  });

  it('should render page title and subtitle', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Requests & Offers')).toBeTruthy();
    expect(screen.getByText('Manage incoming invites, active sessions, and completed help exchanges.')).toBeTruthy();
  });

  it('should render all sections', () => {
    render(<RequestsScreen />);

    expect(screen.getByLabelText('Collapse Active Sessions requests')).toBeTruthy();
    expect(screen.getByLabelText('Collapse Incoming requests')).toBeTruthy();
    expect(screen.getByLabelText('Collapse Outgoing requests')).toBeTruthy();
    expect(screen.getByLabelText('Collapse Completed Sessions requests')).toBeTruthy();
    expect(screen.getByLabelText('Collapse Canceled / Declined requests')).toBeTruthy();
  });

  it('should show incoming requests for current user as receiver', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Requested help for: Math Help')).toBeTruthy();
  });

  it('should show outgoing requests for current user as requester', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Request for help with: Physics Help')).toBeTruthy();
  });

  it('should show active sessions with ACCEPTED status', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Active session: Chemistry Session')).toBeTruthy();
  });

  it('should show completed sessions', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Completed: History Help')).toBeTruthy();
  });

  it('should show canceled/declined requests', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('You declined their request for help with: Biology Help')).toBeTruthy();
  });

  it('should not render if not logged in', () => {
    (authStore.getLoggedInUserId as jest.Mock).mockReturnValue(null);

    const { queryByText } = render(<RequestsScreen />);

    expect(queryByText('Requests & Offers')).toBeFalsy();
  });

  it('should show correct section counts', () => {
    render(<RequestsScreen />);

    expect(screen.getByText('Active Sessions (1)')).toBeTruthy();
    expect(screen.getByText('Incoming (1)')).toBeTruthy();
    expect(screen.getByText('Outgoing (1)')).toBeTruthy();
    expect(screen.getByText('Completed Sessions (1)')).toBeTruthy();
    expect(screen.getByText('Canceled / Declined (1)')).toBeTruthy();
  });

  it('should expose store actions', () => {
    render(<RequestsScreen />);

    expect(requestStore.setRequestStatus).toBeDefined();
    expect(requestStore.deleteRequest).toBeDefined();
    expect(requestStore.completeSessionOnBackend).toBeDefined();
  });

  it('should filter by user involvement', () => {
    const uninvolvedRequest = {
      ...mockRequests[0],
      id: 'req-not-involved',
      requester_id: 'user-5',
      receiver_id: 'user-6',
      status: 'PENDING',
    };

    (requestStore.useRequests as jest.Mock).mockReturnValue([...mockRequests, uninvolvedRequest]);

    render(<RequestsScreen />);

    expect(screen.queryByText('Requested help for: Math Help')).toBeTruthy();
    expect(screen.queryByText('Request for help with: Physics Help')).toBeTruthy();
    expect(screen.queryByText(/req-not-involved/i)).toBeNull();
  });

  it('should handle empty requests', () => {
    (requestStore.useRequests as jest.Mock).mockReturnValue([]);

    render(<RequestsScreen />);

    expect(screen.getByText('Requests & Offers')).toBeTruthy();
    expect(screen.getByText('Active Sessions (0)')).toBeTruthy();
    expect(screen.getByText('Incoming (0)')).toBeTruthy();
    expect(screen.getByText('Outgoing (0)')).toBeTruthy();
    expect(screen.getByText('Completed Sessions (0)')).toBeTruthy();
    expect(screen.getByText('Canceled / Declined (0)')).toBeTruthy();
  });
});


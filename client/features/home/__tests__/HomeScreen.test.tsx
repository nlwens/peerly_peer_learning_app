import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/features/home/screens/HomeScreen';
import * as usersApi from '@/features/users/api/homeUsers';
import * as authStore from '@/shared/store/auth';
import * as userCache from '@/features/users/store/userProfileCache';

jest.mock('@/features/users/api/homeUsers');
jest.mock('@/shared/store/auth');
jest.mock('@/features/users/store/userProfileCache');

const mockUsers = [
  {
    id: 'user-1',
    name: 'Alice',
    strengths: ['Math', 'Physics'],
    needs_help_with: ['History'],
    isPaused: false,
    profile_image_url: 'photo1.jpg',
    education_level: 'Bachelor',
    major: '',
  },
  {
    id: 'user-2',
    name: 'Bob',
    strengths: ['History', 'English'],
    needs_help_with: ['Math'],
    isPaused: false,
    profile_image_url: 'photo2.jpg',
    education_level: 'Master',
    major: '',
  },
  {
    id: 'user-3',
    name: 'Charlie',
    strengths: ['Biology'],
    needs_help_with: ['Physics'],
    isPaused: true,
    profile_image_url: 'photo3.jpg',
    education_level: 'Bachelor',
    major: '',
  },
];

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authStore.useAuth as jest.Mock).mockReturnValue({
      loggedInUserId: 'current-user',
      hydrated: true,
    });

    (usersApi.fetchHomeUsers as jest.Mock).mockResolvedValue(mockUsers);
    (userCache.useUsersList as jest.Mock).mockReturnValue(null);
  });

  it('should render header', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Peerly')).toBeTruthy();
  });

  it('should render search bar', () => {
    render(<HomeScreen />);
    expect(screen.getByPlaceholderText('Search subjects or skills...')).toBeTruthy();
  });

  it('should render filter toggle', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Good at')).toBeTruthy();
    expect(screen.getByText('Need help')).toBeTruthy();
  });

  it('should fetch users on mount', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(usersApi.fetchHomeUsers).toHaveBeenCalledTimes(1);
    });
  });

  it('should render user cards', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.getByLabelText('View profile for Bob')).toBeTruthy();
    });
  });

  it('should not render current user', async () => {
    (authStore.useAuth as jest.Mock).mockReturnValue({
      loggedInUserId: 'user-1',
      hydrated: true,
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.queryByLabelText('View profile for Alice')).toBeNull();
      expect(screen.getByLabelText('View profile for Bob')).toBeTruthy();
    });
  });

  it('should not render paused users', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.queryByLabelText('View profile for Charlie')).toBeNull();
    });
  });

  it('should filter users by search query', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.getByLabelText('View profile for Bob')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search subjects or skills...');
    fireEvent.changeText(searchInput, 'Physics');

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.queryByLabelText('View profile for Bob')).toBeNull();
    });
  });

  it('should search in needs_help_with', async () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByText('Need help'));

    const searchInput = screen.getByPlaceholderText('Search subjects or skills...');
    fireEvent.changeText(searchInput, 'History');

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.queryByLabelText('View profile for Bob')).toBeNull();
    });
  });

  it('should filter by GOOD_AT skill', async () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByText('Good at'));

    const searchInput = screen.getByPlaceholderText('Search subjects or skills...');
    fireEvent.changeText(searchInput, 'Math');

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.queryByLabelText('View profile for Bob')).toBeNull();
    });
  });

  it('should filter by NEED_HELP skill', async () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByText('Need help'));

    const searchInput = screen.getByPlaceholderText('Search subjects or skills...');
    fireEvent.changeText(searchInput, 'Math');

    await waitFor(() => {
      expect(screen.queryByLabelText('View profile for Alice')).toBeNull();
      expect(screen.getByLabelText('View profile for Bob')).toBeTruthy();
    });
  });

  it('should show error message when fetch fails and no cache', async () => {
    (usersApi.fetchHomeUsers as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('should use cached users when available', async () => {
    (userCache.useUsersList as jest.Mock).mockReturnValue(mockUsers);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('View profile for Alice')).toBeTruthy();
      expect(screen.getByLabelText('View profile for Bob')).toBeTruthy();
    });
  });
});


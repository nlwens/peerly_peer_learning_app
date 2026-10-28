import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as authApi from '@/features/auth/api/loginApi';
import * as authStore from '@/shared/store/auth';

jest.mock('@/features/auth/api/loginApi');
jest.mock('@/shared/store/auth');

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

import { router } from 'expo-router';
import LoginScreen from '@/features/auth/screens/LoginScreen';

const mockRouter = router as jest.Mocked<typeof router>;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authStore.loginWithSession as jest.Mock).mockResolvedValue(undefined);
    (mockRouter.canGoBack as jest.Mock).mockReturnValue(true);
  });

  it('should render login form', () => {
    render(<LoginScreen />);

    expect(screen.getByPlaceholderText('Enter Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('should show error when fields are empty', async () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Email and password are required.')).toBeTruthy();
    });
  });

  it('should call postLogin with email and password', async () => {
    (authApi.postLogin as jest.Mock).mockResolvedValueOnce({
      accessToken: 'token123',
      userId: 'user-456',
    });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(authApi.postLogin).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  it('should call loginWithSession on success', async () => {
    (authApi.postLogin as jest.Mock).mockResolvedValueOnce({
      accessToken: 'token123',
      userId: 'user-456',
    });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(authStore.loginWithSession).toHaveBeenCalledWith('token123', 'user-456');
    });
  });

  it('should navigate to home on successful login', async () => {
    (authApi.postLogin as jest.Mock).mockResolvedValueOnce({
      accessToken: 'token123',
      userId: 'user-456',
    });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });

  it('should display error message on login failure', async () => {
    (authApi.postLogin as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Password'), 'wrong');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('should navigate to register screen', () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Register New Account →'));

    expect(mockRouter.push).toHaveBeenCalledWith('/register/credentials');
  });

  it('should call router.back when back button pressed', () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockRouter.canGoBack).toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should fallback to home if cannot go back', () => {
    mockRouter.canGoBack.mockReturnValueOnce(false);

    render(<LoginScreen />);

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
  });
});


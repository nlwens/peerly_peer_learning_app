import { postLogin } from '@/features/auth/api/loginApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('loginApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postLogin', () => {
    it('should extract token from direct response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ token: 'abc123' })),
      });

      const result = await postLogin('user@test.com', 'password');

      expect(result.accessToken).toBe('abc123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('user@test.com'),
        }),
      );
    });

    it('should extract token from data wrapper', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: { accessToken: 'token123' },
            }),
          ),
      });

      const result = await postLogin('user@test.com', 'password');

      expect(result.accessToken).toBe('token123');
    });

    it('should handle Bearer token prefix', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.test',
            }),
          ),
      });

      const result = await postLogin('user@test.com', 'password');

      expect(result.accessToken).toMatch(/^eyJ/);
      expect(result.accessToken).not.toMatch(/Bearer/i);
    });

    it('should extract userId from response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              token: 'abc123',
              userId: 'user-456',
            }),
          ),
      });

      const result = await postLogin('user@test.com', 'password');

      expect(result.userId).toBe('user-456');
    });

    it('should decode userId from JWT sub claim', async () => {
      const jwtWithSub = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXJlYWwtaWQifQ.test';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              token: jwtWithSub,
            }),
          ),
      });

      const result = await postLogin('user@test.com', 'password');

      expect(result.userId).toBe('user-real-id');
    });

    it('should throw on error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: 'Invalid credentials',
            }),
          ),
      });

      await expect(postLogin('user@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('should throw when no token in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ someOtherField: 'value' })),
      });

      await expect(postLogin('user@test.com', 'password')).rejects.toThrow('No token in login response');
    });

    it('should throw on invalid response text', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('not json'),
      });

      await expect(postLogin('user@test.com', 'password')).rejects.toThrow('Invalid response from server');
    });

    it('should trim email before sending', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ token: 'abc' })),
      });

      await postLogin('  user@test.com  ', 'password');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.email).toBe('user@test.com');
    });
  });
});


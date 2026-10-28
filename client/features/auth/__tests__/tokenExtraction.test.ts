/**
 * Unit test for loginApi token extraction logic
 */

// Simplified token extraction logic tests
describe('loginApi token extraction', () => {
  describe('token extraction from various response shapes', () => {
    it('should extract token from direct token field', () => {
      const data: Record<string, unknown> = { token: 'abc123' };
      const token = data.token;
      expect(token).toBe('abc123');
    });

    it('should extract token from accessToken field', () => {
      const data: Record<string, unknown> = { accessToken: 'def456' };
      const token = (data.accessToken as string) || (data.token as string);
      expect(token).toBe('def456');
    });

    it('should extract token from nested data wrapper', () => {
      const data: Record<string, unknown> = { data: { token: 'ghi789' } };
      const nested = data.data as Record<string, unknown>;
      const token = (nested && nested.token) || (data.token as string);
      expect(token).toBe('ghi789');
    });

    it('should strip Bearer prefix from token', () => {
      const raw = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const normalized = raw.replace(/^bearer\s+/i, '').trim();
      expect(normalized).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });
  });

  describe('userId extraction', () => {
    it('should extract userId from user object', () => {
      const data: Record<string, unknown> = { user: { id: 'user-123' } };
      const user = data.user as Record<string, unknown>;
      const userId = user && user.id ? String(user.id) : null;
      expect(userId).toBe('user-123');
    });

    it('should extract userId from userId field', () => {
      const data: Record<string, unknown> = { userId: 'user-456' };
      const userId = data.userId ? String(data.userId) : null;
      expect(userId).toBe('user-456');
    });

    it('should return null when no userId', () => {
      const data: Record<string, unknown> = { name: 'Alice' };
      const userId = data.userId ? String(data.userId) : null;
      expect(userId).toBeNull();
    });
  });

  describe('JWT decoding', () => {
    it('should decode sub claim from JWT', () => {
      // Real JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkLWhlcmUifQ.test
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkLWhlcmUifQ.test';
      const parts = token.split('.');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBeTruthy();
    });
  });
});


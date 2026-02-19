/**
 * Unit Tests for app/lib/auth-guards.server.ts
 *
 * TDD — tests written before implementation.
 * Tests cover all three auth guards:
 *   - requireInternalSecret (novel logic: constant-time Bearer token check)
 *   - requireAdminSession   (delegates to authenticate.admin)
 *   - requireAppProxy       (delegates to authenticate.public.appProxy)
 */

import { mockShopifyAdmin, mockSession } from '../../setup';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../app/shopify.server', () => ({
  authenticate: {
    admin: jest.fn(),
    public: {
      appProxy: jest.fn(),
    },
  },
}));

const { authenticate } = require('../../../app/shopify.server');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://test-app.example.com/api/webhooks/pubsub', {
    method: 'POST',
    headers,
  });
}

async function readJsonBody(response: Response) {
  return response.json();
}

// ─── requireInternalSecret ────────────────────────────────────────────────────

describe('requireInternalSecret', () => {
  const SECRET = 'super-secret-internal-token-abc123';

  beforeEach(() => {
    process.env.INTERNAL_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.INTERNAL_WEBHOOK_SECRET;
  });

  it('returns null when Authorization header matches the secret', async () => {
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: `Bearer ${SECRET}` });
    const result = requireInternalSecret(request);
    expect(result).toBeNull();
  });

  it('returns 401 Response when Authorization header is missing', async () => {
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest();
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    const body = await readJsonBody(result as Response);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when Bearer token is wrong', async () => {
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: 'Bearer wrong-token' });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('returns 401 when Authorization scheme is not Bearer', async () => {
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: `Basic ${SECRET}` });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('returns 401 (fail-closed) when INTERNAL_WEBHOOK_SECRET env var is not set', async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET;
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: `Bearer ${SECRET}` });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('returns 401 when INTERNAL_WEBHOOK_SECRET is an empty string', async () => {
    process.env.INTERNAL_WEBHOOK_SECRET = '';
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: 'Bearer ' });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('does not allow a correct token when env var is unset, even if they match', async () => {
    // Confirms fail-closed: no token === no access regardless of header content
    delete process.env.INTERNAL_WEBHOOK_SECRET;
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest({ Authorization: 'Bearer anything' });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('uses constant-time comparison — different-length tokens return 401', async () => {
    const { requireInternalSecret } = await import('../../../app/lib/auth-guards.server');
    // A token that is a prefix of the real secret should still fail
    const request = makeRequest({ Authorization: `Bearer ${SECRET.slice(0, 5)}` });
    const result = requireInternalSecret(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });
});

// ─── requireAdminSession ──────────────────────────────────────────────────────

describe('requireAdminSession', () => {
  beforeEach(() => {
    authenticate.admin.mockReset();
  });

  it('returns { admin, session } when authenticate.admin resolves', async () => {
    authenticate.admin.mockResolvedValue({
      admin: mockShopifyAdmin,
      session: mockSession,
    });

    const { requireAdminSession } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest();
    const result = await requireAdminSession(request);

    expect(result.admin).toBe(mockShopifyAdmin);
    expect(result.session).toBe(mockSession);
    expect(authenticate.admin).toHaveBeenCalledWith(request);
  });

  it('propagates a thrown Response when authenticate.admin rejects (e.g. redirect to login)', async () => {
    const redirectResponse = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
    authenticate.admin.mockRejectedValue(redirectResponse);

    const { requireAdminSession } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest();

    await expect(requireAdminSession(request)).rejects.toBe(redirectResponse);
  });

  it('calls authenticate.admin exactly once per request', async () => {
    authenticate.admin.mockResolvedValue({ admin: mockShopifyAdmin, session: mockSession });

    const { requireAdminSession } = await import('../../../app/lib/auth-guards.server');
    await requireAdminSession(makeRequest());

    expect(authenticate.admin).toHaveBeenCalledTimes(1);
  });
});

// ─── requireAppProxy ──────────────────────────────────────────────────────────

describe('requireAppProxy', () => {
  beforeEach(() => {
    authenticate.public.appProxy.mockReset();
  });

  it('returns { session } when authenticate.public.appProxy resolves', async () => {
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });

    const { requireAppProxy } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest();
    const result = await requireAppProxy(request);

    expect(result.session).toBe(mockSession);
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(request);
  });

  it('propagates a thrown Response when authenticate.public.appProxy rejects', async () => {
    const errorResponse = new Response(JSON.stringify({ error: 'Invalid proxy signature' }), { status: 401 });
    authenticate.public.appProxy.mockRejectedValue(errorResponse);

    const { requireAppProxy } = await import('../../../app/lib/auth-guards.server');
    const request = makeRequest();

    await expect(requireAppProxy(request)).rejects.toBe(errorResponse);
  });

  it('calls authenticate.public.appProxy exactly once per request', async () => {
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });

    const { requireAppProxy } = await import('../../../app/lib/auth-guards.server');
    await requireAppProxy(makeRequest());

    expect(authenticate.public.appProxy).toHaveBeenCalledTimes(1);
  });
});

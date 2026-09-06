const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('@babel/core');
function load(file, mocks) {
  const code = transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    URL,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected import ${name}`);
      return mocks[name];
    },
  });
  return exports;
}
function management(role, result = { data: [] }) {
  const calls = [];
  const service = load('src/services/adminManagementService.js', {
    '../../lib/supabase': {
      supabase: {
        rpc: async (...args) => {
          calls.push(args);
          return result;
        },
      },
    },
    './profileService': {
      getCurrentProfile: async () => ({ role }),
      isAdminUser: (p) => ['admin', 'super_admin'].includes(p.role),
    },
  });
  return { service, calls };
}
test('ordinary users cannot call management reads or mutations', async () => {
  const { service, calls } = management('user');
  for (const action of [
    () => service.getUsersPage(),
    () => service.getUserDetail('x'),
    () => service.assignUserToAdmin('x', 'y'),
    () => service.setUserRole('x', 'admin'),
  ])
    await assert.rejects(action);
  assert.equal(calls.length, 0);
});
test('admin can request scoped reads but cannot mutate roles, assign or list admins', async () => {
  const { service, calls } = management('admin');
  await service.getUsersPage();
  for (const action of [
    () => service.getAdminsPage(),
    () => service.getManagementSummary(),
    () => service.setUserRole('x', 'admin'),
    () => service.assignUserToAdmin('x', 'y'),
  ])
    await assert.rejects(action);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'get_users_page');
});
test('pagination uses a sentinel and sends search and assignment filters', async () => {
  const { service, calls } = management('super_admin', {
    data: Array.from({ length: 26 }, (_, id) => ({ id })),
  });
  const result = await service.getUsersPage({
    page: 2,
    search: ' Jane ',
    role: 'user',
    adminId: 'a',
  });
  assert.equal(result.data.length, 25);
  assert.equal(result.hasMore, true);
  assert.equal(result.page, 2);
  assert.equal(calls[0][1].p_limit, 26);
  assert.equal(calls[0][1].p_offset, 50);
  assert.equal(calls[0][1].p_search, 'Jane');
  assert.equal(calls[0][1].p_admin_id, 'a');
  await assert.rejects(() => service.getUsersPage({ page: -1 }));
  assert.throws(() => service.setUserRole('x', 'super_admin'));
});
test('missing RPC fails clearly without a table-query fallback', async () => {
  const { service } = management('super_admin', { error: { code: 'PGRST202' } });
  await assert.rejects(() => service.getUsersPage(), /not configured/);
});
function google(result = { type: 'cancel' }) {
  const exchanges = [],
    requests = [];
  const redirect = 'online.ynscrm.card://auth/callback';
  const service = load('src/services/googleAuthService.js', {
    'expo-linking': { createURL: () => redirect },
    'expo-web-browser': { maybeCompleteAuthSession() {}, openAuthSessionAsync: async () => result },
    'expo-constants': { appOwnership: 'standalone' },
    'react-native': { Platform: { OS: 'android' } },
    '../../lib/supabase': {
      supabase: {
        auth: {
          exchangeCodeForSession: async (code) => {
            exchanges.push(code);
            return {};
          },
          signInWithOAuth: async (request) => {
            requests.push(request);
            return { data: { url: 'https://example.com/oauth' } };
          },
        },
      },
    },
  });
  return { service, exchanges, requests, redirect };
}
test('OAuth ignores wrong callback targets and rejects provider errors', async () => {
  const { service, exchanges, redirect } = google();
  assert.equal(await service.completeGoogleSignIn('not a URL'), false);
  assert.equal(
    await service.completeGoogleSignIn('https://example.com/auth/callback?code=x'),
    false
  );
  assert.equal(await service.completeGoogleSignIn(redirect + '/other?code=x'), false);
  await assert.rejects(() => service.completeGoogleSignIn(redirect + '?error=access_denied'));
  assert.equal(exchanges.length, 0);
});
test('OAuth browser success rejects an unexpected callback without exchanging a code', async () => {
  const attempt = google({ type: 'success', url: 'https://example.com/auth/callback?code=x' });
  await assert.rejects(() => attempt.service.signInWithGoogle(), /invalid callback/);
  assert.equal(attempt.exchanges.length, 0);
});
test('OAuth success exchanges a code; cancel creates no session', async () => {
  const cancelled = google();
  await cancelled.service.signInWithGoogle();
  assert.equal(cancelled.exchanges.length, 0);
  const success = google({ type: 'success', url: cancelled.redirect + '?code=one-time-code' });
  await success.service.signInWithGoogle();
  assert.equal(success.exchanges[0], 'one-time-code');
  assert.equal(success.requests[0].provider, 'google');
  assert.equal(success.requests[0].options.skipBrowserRedirect, true);
});
test('existing profile preserves privileged role without recovery; missing profile uses identity-only RPC', async () => {
  for (const existing of [{ id: 'x', role: 'super_admin', admin_id: 'preserve' }, null]) {
    const calls = [];
    const query = {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: existing }),
    };
    const service = load('src/services/profileService.js', {
      '../../lib/supabase': {
        supabase: {
          auth: { getUser: async () => ({ data: { user: { id: 'x' } } }) },
          from: () => query,
          rpc: async (...args) => {
            calls.push(args);
            return { data: { id: 'x', role: 'user' } };
          },
        },
      },
    });
    const profile = await service.getCurrentProfile();
    if (existing) {
      assert.equal(profile.role, 'super_admin');
      assert.equal(profile.admin_id, 'preserve');
      assert.equal(calls.length, 0);
    } else {
      assert.equal(profile.role, 'user');
      assert.equal(calls[0].length, 1);
      assert.equal(calls[0][0], 'ensure_current_profile');
    }
  }
});

// tests/auth.test.js
const request = require('supertest');
const app     = require('../app');

describe('Auth Endpoints', () => {
  let refreshCookie;
  let accessToken;

  beforeAll(async () => {
    // seed the tester user
    await request(app)
      .post('/api/users/register')
      .send({ username: 'tester', password: 'pass123' });
  });

  it('should not register duplicate user (sad path)', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'tester', password: 'pass123' });
    expect(res.statusCode).toBe(409);
  });

  it('should login with correct creds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'tester', password: 'pass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;

    const cookies = res.headers['set-cookie'] || [];
    refreshCookie = cookies
      .map(c => c.split(';')[0])
      .find(c => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'tester', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid credentials' });
  });

  it('should refresh access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    // new jti shouldn’t match old access token's jti
  });

  it('should logout and revoke tokens', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie);

    expect(res.statusCode).toBe(204);
  });

  it('should not allow reuse of access token after logout', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: 'Token has been revoked' });
  });
});

const request = require('supertest');
const app     = require('../app');

describe('User Endpoints', () => {
  let adminToken, userToken, userId;

  beforeAll(async () => {
    // create an admin directly in DB or via a special route
    // for simplicity, assume you have an ADMIN_SECRET to register as admin:
    await request(app)
      .post('/api/users/register')
      .send({ username: 'admin', password: 'adminpass', role: 'admin' });

    await request(app)
      .post('/api/users/register')
      .send({ username: 'normal', password: 'userpass' });

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'adminpass' });
    adminToken = loginAdmin.body.accessToken;

    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'normal', password: 'userpass' });
    userToken = loginUser.body.accessToken;
  });

  it('admin can fetch all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // pick one user
    userId = res.body.find(u => u.username === 'normal').id;
  });

  it('non-admin cannot fetch all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('user can fetch own profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('normal');
  });

  it('admin can fetch any user by id', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(userId);
  });

  it('user cannot fetch other user by id', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('user can update own details', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'normal2' });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('normal2');
  });

  it('user cannot update someone else', async () => {
    const res = await request(app)
      .put(`/api/users/${userId + 1}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'hacker' });
    expect(res.statusCode).toBe(403);
  });

  it('admin can delete a user', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('user cannot delete any user', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });
});

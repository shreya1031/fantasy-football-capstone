import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function registerUser(email = 'test@example.com', password = 'password123') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, displayName: 'Test User' });
  return res.body;
}

describe('Auth routes', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123', displayName: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await registerUser('dup@example.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', displayName: 'Dup User' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('logs in with valid credentials', async () => {
    await registerUser('login@example.com');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('returns current user from /me', async () => {
    const { accessToken } = await registerUser('me@example.com');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });
});

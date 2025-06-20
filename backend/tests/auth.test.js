const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {
  const user = { email: 'test@example.com', password: 'Password123' };

  test('Sign up a user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(user);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User created');
    expect(res.body).toHaveProperty('user');
  });

  test('Valid login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(user);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Invalid login returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpass' });
    expect(res.status).toBe(400);
  });
});

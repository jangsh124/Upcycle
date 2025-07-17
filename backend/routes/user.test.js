const request = require('supertest');
const express = require('express');

jest.mock('../model/User');
const User = require('../model/User');

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { _id: 'user1' };
  next();
});

const router = require('./user');

const app = express();
app.use(express.json());
app.use('/', router);

describe('user wallet update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PATCH /wallet updates walletAddress', async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue({ walletAddress: null, save });

    const res = await request(app)
      .patch('/wallet')
      .send({ walletAddress: '0xabc' });

    expect(res.statusCode).toBe(200);
    expect(save).toHaveBeenCalled();
    expect(res.body).toEqual({ walletAddress: '0xabc' });
  });

  test('PATCH /wallet returns 404 if user missing', async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch('/wallet')
      .send({ walletAddress: '0xabc' });

    expect(res.statusCode).toBe(404);
  });
});

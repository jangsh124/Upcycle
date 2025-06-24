const request = require('supertest');
const express = require('express');

jest.mock('../model/User');
const User = require('../model/User');

jest.mock('nodemailer');
const nodemailer = require('nodemailer');

const router = require('./auth');

const app = express();
app.use(express.json());
app.use('/', router);

describe('password reset routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /forgot-password sends email', async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValue({ email: 'a@a.com', save });
    nodemailer.createTransport.mockReturnValue({ sendMail: jest.fn().mockResolvedValue(true) });

    const res = await request(app).post('/forgot-password').send({ email: 'a@a.com' });
    expect(res.statusCode).toBe(200);
    expect(save).toHaveBeenCalled();
  });

  test('POST /reset-password invalid token', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/reset-password').send({ token: 'bad', password: '123456' });
    expect(res.statusCode).toBe(400);
  });
});
const request = require('supertest');
const express = require('express');

jest.mock('../model/User');
const User = require('../model/User');

jest.mock('nodemailer');
const nodemailer = require('nodemailer');

jest.mock('../middleware/auth', () => (req, res, next) => { req.user = { id: 'user1' }; next(); });

const router = require('./auth');
const fs = require('fs');

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

describe('profile upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
  });

  test('POST /upload-profile removes old image', async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue({ profileImage: '/uploads/profiles/old.jpg', save });

    const res = await request(app)
      .post('/upload-profile')
      .attach('profileImage', Buffer.from('img'), 'new.jpg');

    expect(res.statusCode).toBe(200);
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });
});
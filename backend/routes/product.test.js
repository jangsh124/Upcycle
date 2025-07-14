const request = require('supertest');
const express = require('express');

jest.mock('../model/Product');
const Product = require('../model/Product');

jest.mock('../middleware/auth', () => (req, res, next) => { req.user = { id: 'user1' }; next(); });

const router = require('./product');

const app = express();
app.use('/', router);

describe('product update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PATCH /:id with existing images and no uploads uses provided list', async () => {
    Product.findByIdAndUpdate.mockResolvedValue({ id: '1', images: ['a.jpg'] });

    const res = await request(app)
      .patch('/1')
      .field('existingImages', JSON.stringify(['a.jpg']));

    expect(res.statusCode).toBe(200);
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ images: ['a.jpg'] }),
      { new: true }
    );
  });
});
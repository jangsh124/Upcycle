const request = require('supertest');
const express = require('express');

jest.mock('../model/Product');
const Product = require('../model/Product');

jest.mock('../model/Purchase');
const Purchase = require('../model/Purchase');

jest.mock('../middleware/auth', () => (req, res, next) => { req.user = { id: 'user1' }; next(); });

const router = require('./product');

const app = express();
app.use(express.json());
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

describe('purchase route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /:id/purchase deducts supply and records purchase', async () => {
    const product = { _id: '1', tokenSupply: 5, save: jest.fn().mockResolvedValue(true) };
    Product.findById.mockResolvedValue(product);
    const savePurchase = jest.fn().mockResolvedValue(true);
    Purchase.mockImplementation(() => ({ save: savePurchase }));

    const res = await request(app).post('/1/purchase').send({ quantity: 3 });

    expect(res.statusCode).toBe(200);
    expect(product.tokenSupply).toBe(2);
    expect(Purchase).toHaveBeenCalledWith({
      userId: 'user1',
      productId: '1',
      quantity: 3
    });
    expect(savePurchase).toHaveBeenCalled();
  });

  test('POST /:id/purchase with insufficient supply returns 400', async () => {
    const product = { _id: '1', tokenSupply: 2, save: jest.fn() };
    Product.findById.mockResolvedValue(product);

    const res = await request(app).post('/1/purchase').send({ quantity: 5 });

    expect(res.statusCode).toBe(400);
    expect(Purchase).not.toHaveBeenCalled();
    });

describe('legacy data handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /:id sets default tokenSupply and tokenPrice', async () => {
    const product = { _id: '1', tokenCount: 10, price: 100 };
    Product.findById.mockResolvedValue(product);

    const res = await request(app).get('/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.tokenSupply).toBe(10);
    expect(res.body.tokenPrice).toBe(10);
  });

  test('POST /:id/purchase works when tokenSupply missing', async () => {
    const product = { _id: '1', tokenCount: 5, save: jest.fn().mockResolvedValue(true) };
    Product.findById.mockResolvedValue(product);
    const savePurchase = jest.fn().mockResolvedValue(true);
    Purchase.mockImplementation(() => ({ save: savePurchase }));

    const res = await request(app).post('/1/purchase').send({ quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(product.tokenSupply).toBe(3);
    expect(savePurchase).toHaveBeenCalled();
  });
  });
  });

describe('product creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST / with insufficient tokenSupply returns 400', async () => {
    Product.mockImplementation(() => ({ save: jest.fn() }));

    const res = await request(app)
      .post('/')
      .field('title', 'test')
      .field('price', '100')
      .field('tokenCount', '100')
      .field('tokenSupply', '20')
      .field('location', JSON.stringify({ sido: 's', gugun: 'g' }));

    expect(res.statusCode).toBe(400);
    expect(Product).not.toHaveBeenCalled();
  });

  test('POST / succeeds when tokenSupply meets minimum', async () => {
    const save = jest.fn().mockResolvedValue(true);
    Product.mockImplementation(data => ({ ...data, save }));

    const res = await request(app)
      .post('/')
      .field('title', 'ok')
      .field('price', '100')
      .field('tokenCount', '100')
      .field('tokenSupply', '50')
      .field('location', JSON.stringify({ sido: 's', gugun: 'g' }));

    expect(res.statusCode).toBe(201);
    expect(save).toHaveBeenCalled();
    expect(Product).toHaveBeenCalledWith(expect.objectContaining({ tokenSupply: 50, tokenCount: 100 }));
  });
});
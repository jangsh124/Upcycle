const request = require('supertest');
const express = require('express');

jest.mock('../model/Vote');
const Vote = require('../model/Vote');

jest.mock('../model/Product');
const Product = require('../model/Product');

jest.mock('../middleware/auth', () => (req, res, next) => { req.user = { id: 'user1' }; next(); });

const router = require('./dao');

const app = express();
app.use(express.json());
app.use('/', router);

describe('dao routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /proposals creates proposal and sets product status', async () => {
    const productSave = jest.fn().mockResolvedValue(true);
    Product.findById.mockResolvedValue({ save: productSave });
    const voteSave = jest.fn().mockResolvedValue(true);
    Vote.mockImplementation(() => ({ save: voteSave }));

    const res = await request(app)
      .post('/proposals')
      .send({ productId: '1', proposal: 'sell' });

    expect(res.statusCode).toBe(200);
    expect(Vote).toHaveBeenCalledWith({ productId: '1', proposal: 'sell' });
    expect(voteSave).toHaveBeenCalled();
    expect(productSave).toHaveBeenCalled();
  });

  test('POST /proposals/:id/tally updates status based on votes', async () => {
    const voteSave = jest.fn().mockResolvedValue(true);
    const proposal = { _id: '1', productId: 'p1', yes: ['u1'], no: [], open: true, save: voteSave };
    Vote.findById.mockResolvedValue(proposal);
    const productSave = jest.fn().mockResolvedValue(true);
    Product.findById.mockResolvedValue({ save: productSave });

    const res = await request(app).post('/proposals/1/tally');

    expect(res.statusCode).toBe(200);
    expect(voteSave).toHaveBeenCalled();
    expect(productSave).toHaveBeenCalled();
    expect(res.body.yes).toBe(1);
  });
});
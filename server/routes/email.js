import express from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { sendPurchaseEmail, sendLibraryAccessEmail, sendStyledEmail } from '../services/email.js';

const router = express.Router();

// Send purchase email
router.post('/purchase', async (req, res, next) => {
  try {
    const { buyer_email, products, is_bundle, thank_you_note } = req.body;

    if (!buyer_email || !products) {
      throw new AppError('buyer_email and products are required', 400);
    }

    const result = await sendPurchaseEmail({
      buyer_email,
      products,
      is_bundle,
      thank_you_note
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Send library access email
router.post('/library-access', async (req, res, next) => {
  try {
    const { email, accessUrl } = req.body;

    if (!email || !accessUrl) {
      throw new AppError('email and accessUrl are required', 400);
    }

    const result = await sendLibraryAccessEmail({ email, accessUrl });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Send styled email
router.post('/send', async (req, res, next) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject) {
      throw new AppError('to and subject are required', 400);
    }

    const result = await sendStyledEmail({ to, subject, html, text });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

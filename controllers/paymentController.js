// backend/controllers/paymentController.js
const PaymentTransaction = require('../models/PaymentTransaction');

exports.requestMobileMoneyPayment = async (req, res) => {
  try {
    const { amount, phoneNumber, provider, reference } = req.body;
    
    // Integrate with MTN MoMo or Airtel Money API
    const paymentRequest = await initiateMobileMoneyPayment({
      amount,
      phoneNumber,
      provider,
      reference
    });
    
    const transaction = new PaymentTransaction({
      businessId: req.user.businessId,
      amount,
      phoneNumber,
      provider,
      reference,
      status: 'pending',
      requestId: paymentRequest.requestId
    });
    
    await transaction.save();
    
    res.json({
      message: 'Payment request initiated',
      requestId: paymentRequest.requestId,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment request failed' });
  }
};

exports.confirmMobileMoneyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    const transaction = await PaymentTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check payment status with provider
    const paymentStatus = await checkMobileMoneyStatus(transaction.requestId);
    
    if (paymentStatus.status === 'success') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.providerReference = paymentStatus.providerReference;
      await transaction.save();
      
      res.json({ message: 'Payment confirmed', transaction });
    } else {
      res.json({ message: 'Payment pending', status: paymentStatus.status });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment confirmation failed' });
  }
};

exports.getPaymentTransactions = async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentBalance = async (req, res) => {
  try {
    // This would integrate with mobile money API to get balance
    const balance = {
      available: 0,
      currency: 'RWF'
    };
    
    res.json(balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processCardPayment = async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, amount, reference } = req.body;
    
    // Integrate with card payment gateway
    const paymentResult = await processCardPayment({
      cardNumber,
      expiryDate,
      cvv,
      amount,
      reference
    });
    
    if (paymentResult.success) {
      const transaction = new PaymentTransaction({
        businessId: req.user.businessId,
        amount,
        paymentMethod: 'card',
        reference,
        status: 'completed',
        providerReference: paymentResult.transactionId
      });
      
      await transaction.save();
      
      res.json({ message: 'Card payment successful', transaction });
    } else {
      res.status(400).json({ message: 'Card payment failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await PaymentTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Process refund with provider
    const refundResult = await processRefund(transaction.providerReference);
    
    if (refundResult.success) {
      transaction.status = 'refunded';
      transaction.refundedAt = new Date();
      await transaction.save();
      
      res.json({ message: 'Payment refunded successfully' });
    } else {
      res.status(400).json({ message: 'Refund failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder functions for payment integrations
async function initiateMobileMoneyPayment({ amount, phoneNumber, provider, reference }) {
  return { requestId: `REQ_${Date.now()}` };
}

async function checkMobileMoneyStatus(requestId) {
  return { status: 'success', providerReference: 'TXN_123' };
}

async function processCardPayment({ cardNumber, expiryDate, cvv, amount, reference }) {
  return { success: true, transactionId: `CARD_${Date.now()}` };
}

async function processRefund(providerReference) {
  return { success: true };
}
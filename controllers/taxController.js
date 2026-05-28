// backend/controllers/taxController.js
const TaxTransaction = require('../models/TaxTransaction');
const Business = require('../models/Business');
const Sale = require('../models/Sale');

exports.getPendingTaxes = async (req, res) => {
  try {
    const pendingTaxes = await TaxTransaction.find({
      businessId: req.user.businessId,
      status: 'pending'
    }).populate('saleId').sort({ dueDate: 1 });
    
    res.json(pendingTaxes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaxHistory = async (req, res) => {
  try {
    const taxes = await TaxTransaction.find({
      businessId: req.user.businessId
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json(taxes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaxSummary = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    
    const [pending, paid, overdue, monthlyBreakdown] = await Promise.all([
      TaxTransaction.aggregate([
        { $match: { businessId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      TaxTransaction.aggregate([
        { $match: { businessId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      TaxTransaction.aggregate([
        { $match: { businessId, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      TaxTransaction.aggregate([
        { $match: { businessId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ])
    ]);
    
    res.json({
      pendingTotal: pending[0]?.total || 0,
      paidTotal: paid[0]?.total || 0,
      overdueTotal: overdue[0]?.total || 0,
      monthlyBreakdown: monthlyBreakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.payTax = async (req, res) => {
  try {
    const taxTransaction = await TaxTransaction.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });
    
    if (!taxTransaction) {
      return res.status(404).json({ message: 'Tax transaction not found' });
    }
    
    if (taxTransaction.status === 'paid') {
      return res.status(400).json({ message: 'Tax already paid' });
    }
    
    // Process payment (integrate with MTN MoMo or Airtel Money)
    const paymentResult = await processMobileMoneyPayment({
      amount: taxTransaction.amount,
      phoneNumber: req.body.phoneNumber,
      provider: req.body.provider // 'mtn' or 'airtel'
    });
    
    if (paymentResult.success) {
      taxTransaction.status = 'paid';
      taxTransaction.paidAt = new Date();
      taxTransaction.transactionId = paymentResult.transactionId;
      taxTransaction.paymentMethod = req.body.provider;
      await taxTransaction.save();
      
      // Update business total pending tax
      await Business.findByIdAndUpdate(req.user.businessId, {
        $inc: { totalPendingTax: -taxTransaction.amount, totalPaidTax: taxTransaction.amount }
      });
      
      res.json({ message: 'Tax paid successfully', transaction: taxTransaction });
    } else {
      res.status(400).json({ message: 'Payment failed', error: paymentResult.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.payWithMobileMoney = async (req, res) => {
  try {
    const { taxIds, phoneNumber, provider } = req.body;
    
    const taxes = await TaxTransaction.find({
      _id: { $in: taxIds },
      businessId: req.user.businessId,
      status: 'pending'
    });
    
    const totalAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    
    // Process mobile money payment
    const paymentResult = await processMobileMoneyPayment({
      amount: totalAmount,
      phoneNumber,
      provider
    });
    
    if (paymentResult.success) {
      // Update all taxes as paid
      await TaxTransaction.updateMany(
        { _id: { $in: taxIds } },
        {
          status: 'paid',
          paidAt: new Date(),
          transactionId: paymentResult.transactionId,
          paymentMethod: provider
        }
      );
      
      // Update business
      await Business.findByIdAndUpdate(req.user.businessId, {
        $inc: { totalPendingTax: -totalAmount, totalPaidTax: totalAmount }
      });
      
      res.json({ message: 'Bulk tax payment successful', amount: totalAmount });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOverdueTaxes = async (req, res) => {
  try {
    const overdueTaxes = await TaxTransaction.find({
      businessId: req.user.businessId,
      status: 'pending',
      dueDate: { $lt: new Date() }
    });
    
    // Calculate penalties (5% per month overdue)
    const taxesWithPenalties = overdueTaxes.map(tax => {
      const monthsOverdue = Math.ceil((new Date() - tax.dueDate) / (30 * 24 * 60 * 60 * 1000));
      const penalty = tax.amount * 0.05 * monthsOverdue;
      return {
        ...tax.toObject(),
        penalty,
        totalDue: tax.amount + penalty
      };
    });
    
    res.json(taxesWithPenalties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.mobileMoneyCallback = async (req, res) => {
  try {
    const { transactionId, status, reference } = req.body;
    
    // Update tax transaction with payment status
    await TaxTransaction.findOneAndUpdate(
      { transactionId: reference },
      { 
        status: status === 'success' ? 'paid' : 'pending',
        paidAt: status === 'success' ? new Date() : null
      }
    );
    
    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
};

// Helper function for mobile money integration (placeholder)
async function processMobileMoneyPayment({ amount, phoneNumber, provider }) {
  // This would integrate with actual MTN MoMo or Airtel Money APIs
  // For now, return mock success
  return {
    success: true,
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}
// backend/controllers/invoiceController.js
const Invoice = require('../models/Invoice');
const Sale = require('../models/Sale');
const Business = require('../models/Business');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { createInvoiceFromSale } = require('../utils/createInvoiceFromSale');

exports.getInvoices = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // Backfill invoices for existing sales
    const sales = await Sale.find({ businessId }).sort({ saleDate: -1 }).limit(100);
    for (const sale of sales) {
      await createInvoiceFromSale(sale, businessId);
    }

    const invoices = await Invoice.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
      businessId: req.user.businessId
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    const invoice = await createInvoiceFromSale(sale, req.user.businessId);
    if (!invoice) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
      businessId: req.user.businessId
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Generate PDF
    const doc = new PDFDocument();
    const filename = `invoice_${invoice.invoiceNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('SmartTax Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
    doc.moveDown();
    doc.text('Business Information:');
    doc.text(invoice.businessInfo.name);
    doc.text(`TIN: ${invoice.businessInfo.tin}`);
    doc.moveDown();
    doc.text('Items:');
    
    invoice.items.forEach(item => {
      doc.text(`${item.productName} x ${item.quantity} - RWF ${item.total.toLocaleString()}`);
    });
    
    doc.moveDown();
    doc.text(`Subtotal: RWF ${invoice.subtotal.toLocaleString()}`);
    doc.text(`VAT included (18%): RWF ${invoice.taxAmount.toLocaleString()}`);
    doc.text(`Total: RWF ${invoice.totalAmount.toLocaleString()}`, { bold: true });
    
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
      businessId: req.user.businessId
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (!invoice.customerInfo.email) {
      return res.status(400).json({ message: 'Customer email not available' });
    }
    
    // Configure email transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.customerInfo.email,
      subject: `Invoice ${invoice.invoiceNumber} from SmartTax`,
      html: `
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.customerInfo.name || 'Customer'},</p>
        <p>Thank you for your business. Please find your invoice attached.</p>
        <p>Total Amount: RWF ${invoice.totalAmount.toLocaleString()}</p>
        <p>Due Date: ${invoice.dueDate.toLocaleDateString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: { businessId: req.user.businessId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
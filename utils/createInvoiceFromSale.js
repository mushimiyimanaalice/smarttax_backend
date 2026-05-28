const Invoice = require('../models/Invoice');
const Business = require('../models/Business');

async function createInvoiceFromSale(sale, businessId) {
  const existing = await Invoice.findOne({
    invoiceNumber: sale.invoiceNumber,
    businessId,
  });
  if (existing) return existing;

  const business = await Business.findById(businessId);
  if (!business) return null;

  const invoice = new Invoice({
    businessId,
    saleId: sale._id,
    invoiceNumber: sale.invoiceNumber,
    issueDate: sale.saleDate || new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: sale.items,
    subtotal: sale.subtotal,
    taxAmount: sale.taxAmount,
    totalAmount: sale.totalAmount,
    businessInfo: {
      name: business.name,
      tin: business.taxIdentificationNumber,
      address: business.address,
    },
    customerInfo: {
      name: sale.customerName,
      email: sale.customerEmail,
      phone: sale.customerPhone,
    },
    status: sale.paymentStatus === 'paid' ? 'paid' : 'issued',
  });

  await invoice.save();
  return invoice;
}

module.exports = { createInvoiceFromSale };

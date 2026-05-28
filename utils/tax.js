/** Product price is VAT-inclusive: customer pays this total; VAT is extracted for reporting. */
function splitVatInclusive(totalGross, taxRate = 18) {
  const rate = Number(taxRate) || 18;
  const gross = Number(totalGross) || 0;
  const taxAmount = gross * (rate / (100 + rate));
  const subtotal = gross - taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(gross * 100) / 100,
  };
}

function computeLineItem(unitPrice, quantity, taxRate = 18) {
  const gross = unitPrice * quantity;
  const { subtotal, taxAmount, total } = splitVatInclusive(gross, taxRate);
  return { subtotal, taxAmount, total };
}

module.exports = { splitVatInclusive, computeLineItem };

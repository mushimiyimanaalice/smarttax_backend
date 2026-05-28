/**
 * SMS stub — integrate Twilio / Africa's Talking via env vars in production.
 */
const sendSms = async (phoneNumber, message) => {
  if (process.env.SMS_ENABLED !== 'true') {
    console.log(`[SMS stub] → ${phoneNumber}: ${message}`);
    return { success: true, stub: true };
  }
  // TODO: Twilio / Africa's Talking
  console.log(`[SMS] → ${phoneNumber}: ${message}`);
  return { success: true };
};

module.exports = { sendSms };

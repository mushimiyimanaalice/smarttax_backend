const Sale = require('../models/Sale');
const TaxTransaction = require('../models/TaxTransaction');
const Product = require('../models/Product');
const { getMessage } = require('../utils/notificationMessages');

const UMWISHINGIZI_NAME = 'Umwishingizi';

const SYSTEM_PROMPTS = {
  en: `You are ${UMWISHINGIZI_NAME}, SmartTax Rwanda's friendly AI assistant for SMEs. Be professional, simple, and supportive. Help with sales, taxes, invoices, and reports.`,
  rw: `Uri ${UMWISHINGIZI_NAME}, umufasha wa SmartTax mu Rwanda. Vuga mu buryo bworoshye, ubafashe ku bicuruzwa, imisoro, n'inyemezabuguzi.`,
  fr: `Vous êtes ${UMWISHINGIZI_NAME}, l'assistant SmartTax Rwanda. Soyez professionnel et simple. Aidez avec ventes, taxes et factures.`,
};

const detectIntent = (text) => {
  const t = text.toLowerCase();
  if (/tax|misoro|impôt/.test(t)) return 'taxes';
  if (/sale|gurish|vente|revenue/.test(t)) return 'sales';
  if (/report|raporo|rapport/.test(t)) return 'report';
  if (/pending|pending|itegereje/.test(t)) return 'pending_tax';
  if (/pay|ishyura|payer/.test(t)) return 'pay_tax';
  return 'general';
};

const fetchBusinessContext = async (businessId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [salesToday, pendingTax, products] = await Promise.all([
    Sale.find({ businessId, saleDate: { $gte: today } }).limit(20),
    TaxTransaction.find({ businessId, status: 'pending' }),
    Product.countDocuments({ businessId, isActive: true }),
  ]);

  const todayRevenue = salesToday.reduce((s, x) => s + (x.totalAmount || 0), 0);
  const pendingTotal = pendingTax.reduce((s, x) => s + (x.amount || 0), 0);

  return { salesToday, todayRevenue, pendingTax, pendingTotal, productCount: products };
};

const buildLocalResponse = async (intent, lang, businessId) => {
  const ctx = businessId ? await fetchBusinessContext(businessId) : null;

  const responses = {
    en: {
      taxes: ctx
        ? `You have ${ctx.pendingTax.length} pending tax record(s), total RWF ${ctx.pendingTotal.toLocaleString()}.`
        : 'Connect a business to view taxes.',
      sales: ctx
        ? `Today: ${ctx.salesToday.length} sale(s), revenue RWF ${ctx.todayRevenue.toLocaleString()}.`
        : 'No business selected.',
      report: 'Open Dashboard or Taxes for full reports.',
      pending_tax: ctx
        ? `Pending tax: RWF ${ctx.pendingTotal.toLocaleString()}.`
        : 'No pending tax data.',
      pay_tax: 'Go to Taxes → select a pending item → Pay.',
      general: `Hello! I'm ${UMWISHINGIZI_NAME}. Ask about sales, taxes, or reports.`,
    },
    rw: {
      taxes: ctx
        ? `Ufite imisoro ${ctx.pendingTax.length} itegereje, RWF ${ctx.pendingTotal.toLocaleString()}.`
        : 'Hitamo ubucuruzi mbere.',
      sales: ctx
        ? `Uyumunsi: ${ctx.salesToday.length} gucuruza, RWF ${ctx.todayRevenue.toLocaleString()}.`
        : 'Nta bucuruzi buhitamwo.',
      report: 'Fungura Dashboard cyangwa Taxes.',
      pending_tax: `Imisoro itegereje: RWF ${ctx?.pendingTotal?.toLocaleString() || 0}.`,
      pay_tax: 'Jya kuri Taxes wishyure.',
      general: `Muraho! Nitwa ${UMWISHINGIZI_NAME}. Baza ku gucuriza cyangwa imisoro.`,
    },
    fr: {
      taxes: ctx
        ? `${ctx.pendingTax.length} taxe(s) en attente, total RWF ${ctx.pendingTotal.toLocaleString()}.`
        : 'Sélectionnez une entreprise.',
      sales: ctx
        ? `Aujourd'hui: ${ctx.salesToday.length} vente(s), RWF ${ctx.todayRevenue.toLocaleString()}.`
        : 'Aucune entreprise.',
      report: 'Ouvrez Dashboard ou Taxes.',
      pending_tax: `Taxes en attente: RWF ${ctx?.pendingTotal?.toLocaleString() || 0}.`,
      pay_tax: 'Allez dans Taxes pour payer.',
      general: `Bonjour! Je suis ${UMWISHINGIZI_NAME}.`,
    },
  };

  const pack = responses[lang] || responses.en;
  return pack[intent] || pack.general;
};

const chatWithAI = async ({ message, language = 'en', businessId, userId }) => {
  const lang = ['en', 'rw', 'fr'].includes(language) ? language : 'en';
  const intent = detectIntent(message);

  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const ctx = businessId ? await fetchBusinessContext(businessId) : {};

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[lang] },
          {
            role: 'user',
            content: `Context: ${JSON.stringify(ctx)}\nUser: ${message}`,
          },
        ],
        max_tokens: 300,
      });

      return {
        reply: completion.choices[0]?.message?.content || (await buildLocalResponse(intent, lang, businessId)),
        intent,
        assistant: UMWISHINGIZI_NAME,
      };
    } catch (err) {
      console.warn('OpenAI fallback:', err.message);
    }
  }

  return {
    reply: await buildLocalResponse(intent, lang, businessId),
    intent,
    assistant: UMWISHINGIZI_NAME,
  };
};

module.exports = { chatWithAI, UMWISHINGIZI_NAME, detectIntent, fetchBusinessContext };

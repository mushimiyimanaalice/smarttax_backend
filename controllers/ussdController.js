const User = require('../models/User');
const Business = require('../models/Business');
const TaxTransaction = require('../models/TaxTransaction');
const PaymentTransaction = require('../models/PaymentTransaction');
const Sale = require('../models/Sale');

const LANG = {
  en: {
    notRegistered: 'You are not registered on SmartTax.\nPlease visit smarttax.rw to register.',
    welcome: 'Welcome to SmartTax Rwanda',
    mainMenu: '1. Check Tax Balance\n2. Make Payment\n3. Recent Transactions\n4. Business Status\n5. Change Language',
    selectOption: 'Select an option:',
    taxBalance: 'Your pending tax balance is RWF {amount}\nNext due date: {dueDate}',
    noTaxDue: 'You have no pending tax payments.',
    enterAmount: 'Enter amount to pay (RWF):',
    paymentInitiated: 'Payment of RWF {amount} initiated.\nYou will receive a confirmation SMS.',
    invalidAmount: 'Invalid amount. Please enter a valid number.',
    recentTx: '{list}',
    noTransactions: 'No recent transactions.',
    businessStatus: 'Business: {name}\nStatus: {status}\nTIN: {tin}\nLocation: {location}',
    noBusiness: 'No active business found for your account.',
    langSelect: 'Select language:\n1. English\n2. Kinyarwanda\n3. Français',
    langChanged: 'Language changed to English',
    invalidOption: 'Invalid option. Please try again.',
    goodbye: 'Thank you for using SmartTax. Goodbye!',
  },
  rw: {
    notRegistered: 'Ntabwo wiyandikishije kuri SmartTax.\nNyamuneka sura smarttax.rw kwiyandikisha.',
    welcome: 'Murakaza neza kuri SmartTax Rwanda',
    mainMenu: '1. Reba Amafaranga ya Taxe\n2. Koresha MoMo\n3. Amateka yishyuwe\n4. Reba Ubucuruzi\n5. Guhindura Ururimi',
    selectOption: 'Hitamo:',
    taxBalance: 'Amafaranga ya taxe asigaye ni RWF {amount}\nItariku isohokera: {dueDate}',
    noTaxDue: 'Nta marangamutima ya taxe asigaye.',
    enterAmount: 'Shyiramo amafaranga ugomba kwishyura (RWF):',
    paymentInitiated: 'Kwishyura RWF {amount} byatangiye.\nUzakira ubutumwa bwa SMS buguhishurira.',
    invalidAmount: 'Amafaranga sibyo. Shyiramo umubare ukwiye.',
    recentTx: '{list}',
    noTransactions: 'Nta mateka yishyuwe.',
    businessStatus: 'Ubucuruzi: {name}\nStatus: {status}\nTIN: {tin}\nAho biri: {location}',
    noBusiness: 'Nta bucuruzi bwabonetse.',
    langSelect: 'Hitamo ururimi:\n1. English\n2. Kinyarwanda\n3. Français',
    langChanged: 'Ururimi rwahinduwe. Ubu uri gukoresha Ikinyarwanda',
    invalidOption: 'Ibyo wahisemo ntibishoboka. Ongera ugerageze.',
    goodbye: 'Murakoze gukoresha SmartTax. Murabeho!',
  },
  fr: {
    notRegistered: 'Vous n\'êtes pas inscrit sur SmartTax.\nVisitez smarttax.rw pour vous inscrire.',
    welcome: 'Bienvenue sur SmartTax Rwanda',
    mainMenu: '1. Voir solde de taxe\n2. Effectuer un paiement\n3. Transactions récentes\n4. Statut de l\'entreprise\n5. Changer la langue',
    selectOption: 'Choisissez une option:',
    taxBalance: 'Votre solde de taxe impayé est de RWF {amount}\nDate d\'échéance: {dueDate}',
    noTaxDue: 'Vous n\'avez aucun impôt en attente.',
    enterAmount: 'Entrez le montant à payer (RWF):',
    paymentInitiated: 'Paiement de RWF {amount} initié.\nVous recevrez un SMS de confirmation.',
    invalidAmount: 'Montant invalide. Veuillez entrer un nombre valide.',
    recentTx: '{list}',
    noTransactions: 'Aucune transaction récente.',
    businessStatus: 'Entreprise: {name}\nStatut: {status}\nNIF: {tin}\nLocalisation: {location}',
    noBusiness: 'Aucune entreprise active trouvée.',
    langSelect: 'Choisissez la langue:\n1. English\n2. Kinyarwanda\n3. Français',
    langChanged: 'Langue changée en Français',
    invalidOption: 'Option invalide. Veuillez réessayer.',
    goodbye: 'Merci d\'utiliser SmartTax. Au revoir!',
  },
};

const t = (lang, key, vars = {}) => {
  let str = (LANG[lang] || LANG.en)[key] || LANG.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
};

const detectLang = (user) => user?.preferredLanguage || user?.language || 'en';

const formatRwf = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatDate = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

exports.handleUssd = async (req, res) => {
  try {
    const { phoneNumber, text, sessionId, serviceCode } = req.body;

    const phone = phoneNumber?.replace(/[^0-9]/g, '');
    if (!phone) {
      return res.json({ response: 'END Invalid phone number.' });
    }

    const user = await User.findOne({ phoneNumber: { $regex: phone + '$' } });

    if (!user) {
      return res.json({ response: `END ${t('en', 'notRegistered')}` });
    }

    const lang = detectLang(user);
    const input = (text || '').trim();
    const levels = input ? input.split('*') : [];
    const currentLevel = levels.length;

    if (currentLevel === 0) {
      return res.json({
        response: `CON ${t(lang, 'welcome')}\n${t(lang, 'mainMenu')}`,
      });
    }

    const lastInput = levels[levels.length - 1];

    switch (currentLevel) {
      case 1: {
        switch (lastInput) {
          case '1': {
            const bid = user.activeBusinessId || user.businessId;
            if (!bid) return res.json({ response: `END ${t(lang, 'noBusiness')}` });

            const pending = await TaxTransaction.aggregate([
              { $match: { businessId: bid, status: 'pending' } },
              { $group: { _id: null, total: { $sum: '$amount' }, dueDate: { $max: '$dueDate' } } },
            ]);

            if (!pending.length) return res.json({ response: `END ${t(lang, 'noTaxDue')}` });

            return res.json({
              response: `END ${t(lang, 'taxBalance', {
                amount: formatRwf(pending[0].total),
                dueDate: formatDate(pending[0].dueDate),
              })}`,
            });
          }
          case '2':
            return res.json({ response: `CON ${t(lang, 'enterAmount')}` });
          case '3': {
            const businessId = user.activeBusinessId || user.businessId;
            if (!businessId) return res.json({ response: `END ${t(lang, 'noBusiness')}` });

            const txns = await PaymentTransaction.find({ businessId })
              .sort({ createdAt: -1 }).limit(5);

            if (!txns.length) return res.json({ response: `END ${t(lang, 'noTransactions')}` });

            const list = txns.map((tx, i) =>
              `${i + 1}. RWF ${formatRwf(tx.amount)} - ${tx.status} - ${formatDate(tx.createdAt)}`
            ).join('\n');

            return res.json({ response: `END ${t(lang, 'recentTx', { list })}` });
          }
          case '4': {
            const businessId = user.activeBusinessId || user.businessId;
            if (!businessId) return res.json({ response: `END ${t(lang, 'noBusiness')}` });

            const biz = await Business.findById(businessId);
            if (!biz) return res.json({ response: `END ${t(lang, 'noBusiness')}` });

            const location = [biz.address?.sector, biz.address?.district, biz.address?.province].filter(Boolean).join(', ');

            return res.json({
              response: `END ${t(lang, 'businessStatus', {
                name: biz.name,
                status: biz.status,
                tin: biz.taxIdentificationNumber || biz.registrationNumber || 'N/A',
                location: location || 'N/A',
              })}`,
            });
          }
          case '5':
            return res.json({ response: `CON ${t(lang, 'langSelect')}` });
          default:
            return res.json({ response: `END ${t(lang, 'invalidOption')}` });
        }
      }
      case 2: {
        const prevInput = levels[0];
        if (prevInput === '2') {
          const amount = parseFloat(lastInput);
          if (isNaN(amount) || amount <= 0) {
            return res.json({ response: `END ${t(lang, 'invalidAmount')}` });
          }

          const businessId = user.activeBusinessId || user.businessId;

          await PaymentTransaction.create({
            businessId,
            amount,
            status: 'pending',
            provider: 'airtel',
            paymentMethod: 'ussd',
            metadata: { sessionId, serviceCode, phoneNumber },
          });

          return res.json({
            response: `END ${t(lang, 'paymentInitiated', { amount: formatRwf(amount) })}`,
          });
        }
        if (prevInput === '5') {
          const langMap = { '1': 'en', '2': 'rw', '3': 'fr' };
          const langLabels = { '1': 'English', '2': 'Kinyarwanda', '3': 'Français' };
          const newLang = langMap[lastInput];
          if (!newLang) return res.json({ response: `END ${t(lang, 'invalidOption')}` });

          user.preferredLanguage = newLang;
          await user.save();

          return res.json({
            response: `END ${t(newLang, 'langChanged')}`,
          });
        }
        return res.json({ response: `END ${t(lang, 'invalidOption')}` });
      }
      default:
        return res.json({ response: `END ${t(lang, 'invalidOption')}` });
    }
  } catch (error) {
    console.error('USSD error:', error);
    return res.json({ response: 'END An error occurred. Please try again later.' });
  }
};

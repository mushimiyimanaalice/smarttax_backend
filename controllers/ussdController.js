const User = require('../models/User');
const Business = require('../models/Business');
const TaxTransaction = require('../models/TaxTransaction');
const PaymentTransaction = require('../models/PaymentTransaction');
const Sale = require('../models/Sale');

const LANG = {
  en: {
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
    regWelcome: 'You are not registered.\nRegister now to start using SmartTax.\n1. Register now\n2. Exit',
    regName: 'Enter your full name:',
    regEmail: 'Enter your email address:',
    regTin: 'Enter your Tax Identification Number (TIN):',
    regBizName: 'Enter your business name:',
    regBizType: 'Select business type:\n1. Individual\n2. Company\n3. Partnership',
    regConfirm: 'Confirm registration?\n1. Yes\n2. No',
    regSuccess: 'Registration successful!\nYour temporary password: {password}\nLogin at smarttax.rw to change it.',
    regCancelled: 'Registration cancelled.',
    regInvalidEmail: 'Invalid email address. Please start again.',
    regEmailTaken: 'This email is already registered. Please start again.',
    regTinTaken: 'This TIN is already registered. Please start again.',
  },
  rw: {
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
    regWelcome: 'Ntabwo wiyandikishije.\nIyandikishe ubu utangire gukoresha SmartTax.\n1. Iyandikishe\n2. Sohoka',
    regName: 'Shyiramo izina ryanyu ryose:',
    regEmail: 'Shyiramo email yawe:',
    regTin: 'Shyiramo nimero ya TIN (Tax Identification Number):',
    regBizName: 'Shyiramo izina ryubucuruzi bwawe:',
    regBizType: 'Hitamo ubwoko bwubucuruzi:\n1. Kugiti cyawe\n2. Isosiyete\n3. Ubufatanye',
    regConfirm: 'Emeza iyandikisha?\n1. Yego\n2. Oya',
    regSuccess: 'Iyandikisho ryakunze!\nIjambobanga ryawe ryagateka: {password}\nInjira kuri smarttax.rw urihindure.',
    regCancelled: 'Iyandikisho ryahagaritswe.',
    regInvalidEmail: 'Email yanditse ntabwo ariyo. Ongera utangire.',
    regEmailTaken: 'Iyi email imaze kwiyandikisha. Ongera utangire.',
    regTinTaken: 'iyi TIN imaze kwiyandikisha. Ongera utangire.',
  },
  fr: {
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
    regWelcome: 'Vous n\'êtes pas inscrit.\nInscrivez-vous maintenant pour utiliser SmartTax.\n1. S\'inscrire\n2. Quitter',
    regName: 'Entrez votre nom complet:',
    regEmail: 'Entrez votre adresse email:',
    regTin: 'Entrez votre Numéro d\'Identification Fiscale (NIF):',
    regBizName: 'Entrez le nom de votre entreprise:',
    regBizType: 'Sélectionnez le type d\'entreprise:\n1. Individuel\n2. Société\n3. Partenariat',
    regConfirm: 'Confirmer l\'inscription?\n1. Oui\n2. Non',
    regSuccess: 'Inscription réussie!\nVotre mot de passe temporaire: {password}\nConnectez-vous sur smarttax.rw pour le changer.',
    regCancelled: 'Inscription annulée.',
    regInvalidEmail: 'Adresse email invalide. Veuillez recommencer.',
    regEmailTaken: 'Cet email est déjà inscrit. Veuillez recommencer.',
    regTinTaken: 'Ce NIF est déjà inscrit. Veuillez recommencer.',
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

const respond = (res, message) => {
  res.type('text/plain').send(message);
};

const handleRegistration = async (req, res, levels, level) => {
  if (level === 0) {
    return respond(res, `CON ${t('en', 'regWelcome')}`);
  }

  const choice = levels[0];
  if (choice === '2') {
    return respond(res, `END ${t('en', 'goodbye')}`);
  }
  if (choice !== '1') {
    return respond(res, `END ${t('en', 'invalidOption')}`);
  }

  switch (level) {
    case 1:
      return respond(res, `CON ${t('en', 'regName')}`);
    case 2:
      return respond(res, `CON ${t('en', 'regEmail')}`);
    case 3:
      return respond(res, `CON ${t('en', 'regTin')}`);
    case 4:
      return respond(res, `CON ${t('en', 'regBizName')}`);
    case 5:
      return respond(res, `CON ${t('en', 'regBizType')}`);
    case 6:
      return respond(res, `CON ${t('en', 'regConfirm')}`);
    case 7: {
      const confirm = levels[6];
      if (confirm !== '1') {
        return respond(res, `END ${t('en', 'regCancelled')}`);
      }

      const name = levels[1]?.trim();
      const email = levels[2]?.trim().toLowerCase();
      const tin = levels[3]?.trim();
      const bizName = levels[4]?.trim();
      const bizTypeVal = levels[5];
      const typeMap = { '1': 'individual', '2': 'company', '3': 'partnership' };

      if (!email || !email.includes('@')) {
        return respond(res, `END ${t('en', 'regInvalidEmail')}`);
      }
      if (!name || !tin || !bizName || !typeMap[bizTypeVal]) {
        return respond(res, `END ${t('en', 'invalidOption')}`);
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return respond(res, `END ${t('en', 'regEmailTaken')}`);
      }

      const existingBiz = await Business.findOne({
        $or: [{ taxIdentificationNumber: tin }, { registrationNumber: tin }],
      });
      if (existingBiz) {
        return respond(res, `END ${t('en', 'regTinTaken')}`);
      }

      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase() + '1!';

      const newUser = await User.create({
        fullName: name,
        email,
        phoneNumber: req.body.phoneNumber?.replace(/[^0-9]/g, ''),
        password: tempPassword,
        role: 'business_owner',
        language: 'en',
        preferredLanguage: 'en',
      });

      const newBiz = await Business.create({
        name: bizName,
        registrationNumber: tin,
        taxIdentificationNumber: tin,
        businessType: typeMap[bizTypeVal],
        ownerId: newUser._id,
        status: 'pending_approval',
      });

      newUser.businessId = newBiz._id;
      newUser.businessIds = [newBiz._id];
      newUser.activeBusinessId = newBiz._id;
      await newUser.save();

      return respond(res, `END ${t('en', 'regSuccess', { password: tempPassword })}`);
    }
    default:
      return respond(res, `END ${t('en', 'invalidOption')}`);
  }
};

exports.handleUssd = async (req, res) => {
  try {
    const { phoneNumber, text, sessionId, serviceCode } = req.body;

    const phone = phoneNumber?.replace(/[^0-9]/g, '');
    if (!phone) {
      return respond(res, 'END Invalid phone number.');
    }

    const user = await User.findOne({ phoneNumber: { $regex: phone + '$' } });

    if (!user) {
      const input = (text || '').trim();
      const levels = input ? input.split('*') : [];
      return handleRegistration(req, res, levels, levels.length);
    }

    const lang = detectLang(user);
    const input = (text || '').trim();
    const levels = input ? input.split('*') : [];
    const currentLevel = levels.length;

    if (currentLevel === 0) {
      return respond(res, `CON ${t(lang, 'welcome')}\n${t(lang, 'mainMenu')}`);
    }

    const lastInput = levels[levels.length - 1];

    switch (currentLevel) {
      case 1: {
        switch (lastInput) {
          case '1': {
            const bid = user.activeBusinessId || user.businessId;
            if (!bid) return respond(res, `END ${t(lang, 'noBusiness')}`);

            const pending = await TaxTransaction.aggregate([
              { $match: { businessId: bid, status: 'pending' } },
              { $group: { _id: null, total: { $sum: '$amount' }, dueDate: { $max: '$dueDate' } } },
            ]);

            if (!pending.length) return respond(res, `END ${t(lang, 'noTaxDue')}`);

            return respond(res, `END ${t(lang, 'taxBalance', {
              amount: formatRwf(pending[0].total),
              dueDate: formatDate(pending[0].dueDate),
            })}`);
          }
          case '2':
            return respond(res, `CON ${t(lang, 'enterAmount')}`);
          case '3': {
            const businessId = user.activeBusinessId || user.businessId;
            if (!businessId) return respond(res, `END ${t(lang, 'noBusiness')}`);

            const txns = await PaymentTransaction.find({ businessId })
              .sort({ createdAt: -1 }).limit(5);

            if (!txns.length) return respond(res, `END ${t(lang, 'noTransactions')}`);

            const list = txns.map((tx, i) =>
              `${i + 1}. RWF ${formatRwf(tx.amount)} - ${tx.status} - ${formatDate(tx.createdAt)}`
            ).join('\n');

            return respond(res, `END ${t(lang, 'recentTx', { list })}`);
          }
          case '4': {
            const businessId = user.activeBusinessId || user.businessId;
            if (!businessId) return respond(res, `END ${t(lang, 'noBusiness')}`);

            const biz = await Business.findById(businessId);
            if (!biz) return respond(res, `END ${t(lang, 'noBusiness')}`);

            const location = [biz.address?.sector, biz.address?.district, biz.address?.province].filter(Boolean).join(', ');

            return respond(res, `END ${t(lang, 'businessStatus', {
              name: biz.name,
              status: biz.status,
              tin: biz.taxIdentificationNumber || biz.registrationNumber || 'N/A',
              location: location || 'N/A',
            })}`);
          }
          case '5':
            return respond(res, `CON ${t(lang, 'langSelect')}`);
          default:
            return respond(res, `END ${t(lang, 'invalidOption')}`);
        }
      }
      case 2: {
        const prevInput = levels[0];
        if (prevInput === '2') {
          const amount = parseFloat(lastInput);
          if (isNaN(amount) || amount <= 0) {
            return respond(res, `END ${t(lang, 'invalidAmount')}`);
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

          return respond(res, `END ${t(lang, 'paymentInitiated', { amount: formatRwf(amount) })}`);
        }
        if (prevInput === '5') {
          const langMap = { '1': 'en', '2': 'rw', '3': 'fr' };
          const langLabels = { '1': 'English', '2': 'Kinyarwanda', '3': 'Français' };
          const newLang = langMap[lastInput];
          if (!newLang) return respond(res, `END ${t(lang, 'invalidOption')}`);

          user.preferredLanguage = newLang;
          await user.save();

          return respond(res, `END ${t(newLang, 'langChanged')}`);
        }
        return respond(res, `END ${t(lang, 'invalidOption')}`);
      }
      default:
        return respond(res, `END ${t(lang, 'invalidOption')}`);
    }
  } catch (error) {
    console.error('USSD error:', error);
    return respond(res, 'END An error occurred. Please try again later.');
  }
};

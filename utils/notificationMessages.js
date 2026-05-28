const MESSAGES = {
  greeting_morning: {
    en: 'Good morning 👋 We appreciate your hard work today.',
    rw: 'Mwaramutse neza 👋 Turashimira akazi mukora buri munsi.',
    fr: 'Bonjour 👋 Merci pour votre travail aujourd\'hui.',
  },
  greeting_afternoon: {
    en: 'Good afternoon 👋 Keep up the great work today.',
    rw: 'Mwiriwe neza 👋 Mukomeze akazi keza.',
    fr: 'Bon après-midi 👋 Continuez votre excellent travail.',
  },
  inactivity_reminder: {
    en: 'No sales activity detected today. Please explain why your business was inactive today.',
    rw: 'Nta gucuruza kwabonetse uyumunsi. Sobanura impamvu ubucuruzi bwawe budakora.',
    fr: 'Aucune vente détectée aujourd\'hui. Expliquez pourquoi votre entreprise était inactive.',
  },
  business_approved: {
    en: 'Your business has been approved and is now ACTIVE. You can start selling.',
    rw: 'Ubucuruzi bwemejwe kandi bukora. Murashobora gutangira kugurisha.',
    fr: 'Votre entreprise est approuvée et ACTIVE. Vous pouvez commencer à vendre.',
  },
  business_rejected: {
    en: 'Your business registration was rejected. Contact your sector admin for details.',
    rw: 'Kwiyandikisha ubucuruzi byanze. Vugana n\'umuyobozi w\'umurenge.',
    fr: 'Votre inscription a été rejetée. Contactez l\'administrateur du secteur.',
  },
  approval_request: {
    en: 'New business pending approval in your sector.',
    rw: 'Ubucuruzi bushya butegereje kwemezwa mu murenge wawe.',
    fr: 'Nouvelle entreprise en attente d\'approbation dans votre secteur.',
  },
  product_created: {
    en: 'New product added to your inventory.',
    rw: 'Ibicuruzwa bishya byiyongereye mu bubiko bwawe.',
    fr: 'Nouveau produit ajouté à votre inventaire.',
  },
  sale_completed: {
    en: 'Sale completed successfully.',
    rw: 'Igurishwa ryakozwe neza.',
    fr: 'Vente effectuée avec succès.',
  },
  inventory_low: {
    en: 'Some products are running low on stock.',
    rw: 'Ibicuruzwa bimwe na bimwe biragabanuka mu bubiko.',
    fr: 'Certains produits sont en rupture de stock imminente.',
  },
};

const getMessage = (type, lang = 'en') => {
  const pack = MESSAGES[type];
  if (!pack) return { title: 'SmartTax', message: '' };
  const language = ['en', 'rw', 'fr'].includes(lang) ? lang : 'en';
  return {
    title: 'SmartTax',
    message: pack[language],
    language,
  };
};

module.exports = { MESSAGES, getMessage };

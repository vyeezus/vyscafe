(function () {
  const c = window.VY_FIREBASE_CONFIG;
  if (
    typeof firebase === 'undefined' ||
    !c ||
    !c.apiKey ||
    c.apiKey === 'YOUR_API_KEY' ||
    !c.projectId ||
    c.projectId === 'YOUR_PROJECT_ID'
  ) {
    window.VY_FIREBASE_ACTIVE = false;
    return;
  }
  try {
    firebase.initializeApp(c);
    window.VY_FIREBASE_ACTIVE = true;
  } catch (e) {
    console.warn('Firebase init failed:', e);
    window.VY_FIREBASE_ACTIVE = false;
  }
})();

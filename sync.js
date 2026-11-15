// Optional cross-device sync for the SQL trainer.
//
// Does nothing at all until sync-config.js holds a real Firebase config: the app
// then keeps working exactly as before, on localStorage only. When a config is
// present the user signs in with Google and the whole state is mirrored to one
// Firestore document per user. Every write merges first (see mergeState in
// index.html), so two devices never overwrite each other's progress.
//
// The Firebase web config is an identifier, not a credential. Access is controlled
// by firestore.rules, which allow each signed-in user to touch only their own document.

(function(){
  'use strict';

  const CFG = window.SYNC_CONFIG || {};
  const configured = !!(CFG.apiKey && CFG.projectId && CFG.appId);
  const V = '10.14.1';
  const listeners = [];
  let fb = null;          // loaded firebase modules
  let user = null;
  let unsub = null;
  let applying = false;   // guard against write -> snapshot -> write loops
  let pushTimer = null;

  const api = {
    configured,
    get user(){ return user; },
    status: configured ? 'signed-out' : 'off',
    detail: '',
    onChange(fn){ listeners.push(fn); },
    init, signIn, signOut, syncNow
  };
  window.TrainerSync = api;

  function emit(status, detail){
    api.status = status; api.detail = detail || '';
    for (const fn of listeners) { try { fn(api); } catch(e){} }
  }

  let hooks = null;
  function init(h){
    hooks = h;                       // {getState, setState, merge}
    if (!configured) { emit('off', 'סנכרון כבוי. ראה את ההוראות ב-README.'); return; }
    load().catch(err => emit('error', String(err && err.message || err)));
  }

  async function load(){
    emit('loading', 'טוען את ספריית הסנכרון');
    const [app, auth, store] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    fb = {app, auth, store};
    const application = app.initializeApp(CFG);
    fb.authInstance = auth.getAuth(application);
    fb.db = store.initializeFirestore(application, {});
    try { await store.enableIndexedDbPersistence(fb.db); } catch(e){ /* multi-tab or unsupported: fine */ }
    try { await auth.getRedirectResult(fb.authInstance); } catch(e){ /* no pending redirect */ }
    auth.onAuthStateChanged(fb.authInstance, u => { user = u; u ? attach() : detach(); });
    if (!user) emit('signed-out', 'לא מחובר. ההתקדמות נשמרת מקומית בלבד.');
  }

  function docRef(){ return fb.store.doc(fb.db, 'trainerState', user.uid); }

  function attach(){
    emit('syncing', 'מסנכרן');
    if (unsub) unsub();
    unsub = fb.store.onSnapshot(docRef(), snap => {
      if (snap.metadata.hasPendingWrites) return;          // our own write coming back
      const raw = snap.exists() ? snap.data().state : null;
      let remote = null;
      if (raw) { try { remote = JSON.parse(raw); } catch(e){} }
      applying = true;
      try {
        const merged = hooks.merge(hooks.getState(), remote);
        hooks.setState(merged);
      } finally { applying = false; }
      emit('on', 'מסונכרן · ' + (user.email || user.displayName || 'מחובר'));
      schedulePush(1200);                                   // write back the merge
    }, err => emit('error', String(err && err.message || err)));
  }

  function detach(){
    if (unsub) { unsub(); unsub = null; }
    emit('signed-out', 'לא מחובר. ההתקדמות נשמרת מקומית בלבד.');
  }

  function schedulePush(delay){
    if (!user || applying) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { push().catch(err => emit('error', String(err && err.message || err))); }, delay == null ? 2500 : delay);
  }
  api.changed = () => schedulePush();

  async function push(){
    if (!user) return;
    const ref = docRef();
    await fb.store.runTransaction(fb.db, async tx => {
      const snap = await tx.get(ref);
      let remote = null;
      if (snap.exists() && snap.data().state) { try { remote = JSON.parse(snap.data().state); } catch(e){} }
      const merged = hooks.merge(hooks.getState(), remote);
      applying = true; try { hooks.setState(merged); } finally { applying = false; }
      tx.set(ref, {state: JSON.stringify(merged), updatedAt: Date.now()});
    });
    emit('on', 'נשמר בענן · ' + new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}));
  }

  // used by "reset progress": replaces the cloud copy instead of merging into it,
  // otherwise the next snapshot would restore everything the user just deleted
  async function overwrite(stateObj){
    if (!user) return;
    await fb.store.setDoc(docRef(), {state: JSON.stringify(stateObj), updatedAt: Date.now()});
    emit('on', 'הענן אופס גם הוא');
  }
  api.overwrite = overwrite;

  async function signIn(){
    if (!fb) return;
    const provider = new fb.auth.GoogleAuthProvider();
    try { await fb.auth.signInWithPopup(fb.authInstance, provider); }
    catch(e){
      // standalone iOS web apps and blocked popups fall back to a full-page redirect
      if (/popup|operation-not-supported|cancelled/i.test(e.code || '')) { await fb.auth.signInWithRedirect(fb.authInstance, provider); }
      else emit('error', String(e.message || e));
    }
  }
  async function signOut(){ if (fb) { try { await push(); } catch(e){} await fb.auth.signOut(fb.authInstance); } }
  async function syncNow(){ if (!user) return; emit('syncing', 'מסנכרן'); try { await push(); } catch(e){ emit('error', String(e.message || e)); } }
})();

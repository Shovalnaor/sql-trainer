// Runs every reference query, live theory example and quiz definition in index.html
// against the real engine (sql-asm.js). Usage: node tests/verify.js [path/to/index.html]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const bank = html.split('//<BANK>')[1].split('//</BANK>')[0];
const api = new Function(bank + '\nreturn {DATA,EXERCISES,TOPICS,THEORY,buildDb,runQuery,compare,staticWarnings,isSelectOnly,translateError,derivedAliasCheck,mergeState,looksLikeState,LAB,LAB_SCHEMA,buildLabDb,labRun};')();
const initSqlJs = require(path.join(root, 'sql-asm.js'));

initSqlJs().then(SQL => {
  const db = api.buildDb(SQL);
  let fail = 0;
  const problem = (...a) => { fail++; console.log('FAIL', ...a); };

  // exercises: unique ids, valid topic, non-empty reference result, no static warning, self-compare ok
  const ids = new Set();
  for (const e of api.EXERCISES) {
    if (ids.has(e.id)) problem('duplicate id', e.id); ids.add(e.id);
    if (!api.TOPICS.some(t => t.key === e.topic)) problem('unknown topic', e.id);
    if (!Array.isArray(e.hints) || !e.hints.length) problem('no hints', e.id);
    if (!api.isSelectOnly(e.sql)) problem('reference is not a SELECT', e.id);
    let r; try { r = api.runQuery(db, e.sql); } catch (err) { problem('reference errors', e.id, err.message); continue; }
    if (!r.values.length) problem('empty reference result', e.id);
    const w = api.staticWarnings(e.sql); if (w.length) problem('static warning on reference', e.id, w[0]);
    if (!api.compare(r, r, !!e.ordered).ok) problem('self-compare failed', e.id);
  }
  console.log(`exercises: ${api.EXERCISES.length}`);

  // theory: examples run and return rows, quizzes well-formed
  let nex = 0, nq = 0;
  const cardTopics = new Set();
  for (const t of api.THEORY) {
    if (cardTopics.has(t.topic)) problem('duplicate theory card topic', t.topic);
    cardTopics.add(t.topic);
    for (const x of t.examples) {
      nex++;
      try { const r = api.runQuery(db, x.sql); if (!r.values.length) problem('empty example', t.topic, x.label); }
      catch (err) { problem('example errors', t.topic, x.label, err.message); }
    }
    for (const q of t.quiz) {
      nq++;
      if (!q.q || !q.a || !Array.isArray(q.o) || q.o.length !== 3 || q.o.includes(q.a) || new Set(q.o).size !== 3 || !q.why) problem('quiz shape', t.topic, q.q);
    }
  }
  console.log(`theory examples: ${nex}, quiz questions: ${nq}`);

  // checker behaviour on known good / bad queries
  const expect = (name, cond) => { if (!cond) problem('checker', name); };
  const ref = id => api.runQuery(db, api.EXERCISES.find(e => e.id === id).sql);
  expect('order-only mismatch', api.compare(ref('A2'), api.runQuery(db, "SELECT order_id, amount FROM orders WHERE status='סופקה' AND amount>5000 ORDER BY amount"), true).orderOnly === true);
  expect('ROUND tolerated', api.compare(ref('B4'), api.runQuery(db, "SELECT condition, ROUND(AVG(amount),2) FROM orders GROUP BY condition"), false).ok);
  expect('COUNT(*) LEFT JOIN trap caught', !api.compare(ref('F2'), api.runQuery(db, "SELECT s.supplier_name, COUNT(*) FROM suppliers s LEFT JOIN orders o ON s.supplier_id=o.supplier_id GROUP BY s.supplier_name"), false).ok);
  expect('partial GROUP BY warned', api.staticWarnings("SELECT status, district, COUNT(*) FROM orders GROUP BY status").length === 1);
  expect('alias in GROUP BY ok', api.staticWarnings("SELECT status s, COUNT(*) c FROM orders GROUP BY status").length === 0);
  expect('= NULL warned', api.staticWarnings("SELECT * FROM orders WHERE amount = NULL").length === 1);
  expect('aggregate in WHERE warned', api.staticWarnings("SELECT supplier_id FROM orders WHERE COUNT(*) > 3 GROUP BY supplier_id").length === 1);
  expect('HAVING not mistaken for WHERE', api.staticWarnings("SELECT district FROM orders WHERE status='x' GROUP BY district HAVING SUM(amount) > 1").length === 0);
  expect('derived table without alias warned', !!api.derivedAliasCheck('SELECT AVG(cnt) FROM (SELECT supplier_id, COUNT(*) AS cnt FROM orders GROUP BY supplier_id)'));
  expect('derived table with alias ok', !api.derivedAliasCheck('SELECT AVG(cnt) FROM (SELECT supplier_id, COUNT(*) AS cnt FROM orders GROUP BY supplier_id) t WHERE cnt > 1'));
  expect('scalar subquery not flagged', !api.derivedAliasCheck('SELECT order_id FROM orders WHERE amount > (SELECT AVG(amount) FROM orders)'));
  expect('window in WHERE translated', /חלון/.test(api.translateError('misuse of window function ROW_NUMBER()')));
  expect('non-select blocked', !api.isSelectOnly("DROP TABLE orders") && !api.isSelectOnly("SELECT 1; DELETE FROM orders"));
  expect('error translated', /product_nme/.test(api.translateError('no such column: product_nme')));

  // lab: every reference solution must run on a fresh lab db and satisfy its own check
  const labIds = new Set();
  for (const e of api.LAB) {
    if (labIds.has(e.id) || ids.has(e.id)) problem('duplicate lab id', e.id); labIds.add(e.id);
    if (!Array.isArray(e.hints) || !e.hints.length) problem('lab exercise has no hints', e.id);
    if (!e.check) problem('lab exercise has no check query', e.id);
    let r; try { r = api.labRun(SQL, e.sql, e.check); } catch (err) { problem('lab reference fails', e.id, err.message); continue; }
    if (!r.values.length) problem('lab check returns nothing', e.id);
    if (!api.compare(r, r, false).ok) problem('lab self-compare failed', e.id);
    // the check must actually discriminate: an empty submission must not pass
    let empty; try { empty = api.labRun(SQL, 'SELECT 1', e.check); } catch (err) { empty = null; }
    if (empty && api.compare(r, empty, false).ok) problem('lab check passes with no work done', e.id);
  }
  console.log(`lab exercises: ${api.LAB.length}`);

  // each lab run starts from a clean database
  const fresh1 = api.labRun(SQL, "INSERT INTO Students VALUES (99,'A','B','C',1,10)", 'SELECT COUNT(*) FROM Students');
  const fresh2 = api.labRun(SQL, 'SELECT 1', 'SELECT COUNT(*) FROM Students');
  expect('lab db resets between runs', fresh1.values[0][0] === fresh2.values[0][0] + 1);
  expect('lab enforces foreign keys', (() => { try { api.labRun(SQL, "INSERT INTO Students VALUES (98,'A','B','C',1,999)", 'SELECT 1'); return false; } catch (e) { return /FOREIGN KEY/i.test(e.message); } })());

  // state merge: two devices must converge without losing anything
  const m = api.mergeState;
  const A = {
    progress: {A1:{solved:true,attempts:2,hints:1,solution:false,stage:1,due:100,seconds:90}, A2:{solved:false,attempts:3,hints:0,solution:true}},
    journal: [{ts:300,kind:'solved',ex:'A1'},{ts:100,kind:'wrong',ex:'A2',msg:'x'}],
    quiz: {A0:{answered:true,correct:true,ts:50}, A1:{answered:true,correct:false,ts:60}},
    exams: [{ts:10,score:4,total:10}], read:{A:true}, drafts:{A3:'SELECT 1'}, theme:'dark', lastExercise:'A2'
  };
  const B = {
    progress: {A1:{solved:false,attempts:1,hints:0,solution:false,stage:0,due:50,seconds:40}, B1:{solved:true,attempts:1,hints:0,solution:false}},
    journal: [{ts:300,kind:'solved',ex:'A1'},{ts:200,kind:'quiz',ex:'QB0'}],
    quiz: {A1:{answered:true,correct:true,ts:70}, B0:{answered:true,correct:false,ts:80}},
    exams: [{ts:20,score:7,total:10}], read:{B:true}, drafts:{A3:'',B2:'SELECT 2'}, theme:'light'
  };
  const ab = m(A,B), ba = m(B,A);
  expect('merge keeps solved from either side', ab.progress.A1.solved && ab.progress.B1.solved);
  expect('merge takes the higher attempt count', ab.progress.A1.attempts === 2 && ab.progress.A1.hints === 1);
  expect('merge keeps the furthest review date', ab.progress.A1.due === 100 && ab.progress.A1.stage === 1);
  expect('merge keeps the best solve time', ab.progress.A1.seconds === 40);
  expect('merge keeps a flag set on one side only', ab.progress.A2.solution === true);
  expect('merge unions the journal and drops the duplicate', ab.journal.length === 3);
  expect('merge sorts the journal newest first', ab.journal[0].ts === 300 && ab.journal[2].ts === 100);
  expect('merge unions exams', ab.exams.length === 2);
  expect('merge keeps a correct quiz answer', ab.quiz.A1.correct === true && ba.quiz.A1.correct === true);
  expect('merge unions cards read', ab.read.A && ab.read.B);
  expect('merge keeps a non-empty draft over an empty one', ab.drafts.A3 === 'SELECT 1' && ab.drafts.B2 === 'SELECT 2');
  expect('merge order does not change progress', JSON.stringify(ab.progress) === JSON.stringify(ba.progress));
  expect('merge order does not change the journal', JSON.stringify(ab.journal) === JSON.stringify(ba.journal));
  expect('local device keeps its own theme', ab.theme === 'dark' && ba.theme === 'light');
  expect('merge is idempotent', JSON.stringify(m(ab, ab).progress) === JSON.stringify(ab.progress));
  expect('merge survives null and empty input', m(null, null).journal.length === 0 && m(A, null).progress.A1.solved && m(null, B).progress.B1.solved);
  expect('merge caps the journal at 600', m({journal: Array.from({length:800}, (_,i)=>({ts:i,kind:'wrong',ex:'X'+i}))}, {}).journal.length === 600);
  expect('merge never loses a solved exercise', Object.keys(ab.progress).filter(k=>ab.progress[k].solved).length === 2);
  expect('state shape guard accepts real state', api.looksLikeState(A));
  expect('state shape guard rejects junk', !api.looksLikeState({hello:1}) && !api.looksLikeState(null) && !api.looksLikeState([]));

  console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL CHECKS PASSED');
  process.exit(fail ? 1 : 0);
});

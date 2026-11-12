// Runs every reference query, live theory example and quiz definition in index.html
// against the real engine (sql-asm.js). Usage: node tests/verify.js [path/to/index.html]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const bank = html.split('//<BANK>')[1].split('//</BANK>')[0];
const api = new Function(bank + '\nreturn {DATA,EXERCISES,TOPICS,THEORY,buildDb,runQuery,compare,staticWarnings,isSelectOnly,translateError};')();
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
  for (const t of api.THEORY) {
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
  expect('non-select blocked', !api.isSelectOnly("DROP TABLE orders") && !api.isSelectOnly("SELECT 1; DELETE FROM orders"));
  expect('error translated', /product_nme/.test(api.translateError('no such column: product_nme')));

  console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL CHECKS PASSED');
  process.exit(fail ? 1 : 0);
});

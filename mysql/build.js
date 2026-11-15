// Regenerates mysql/schema.sql and mysql/exercises.sql from the data in index.html,
// so the MySQL copy can never drift from what the trainer uses.
// Run: node mysql/build.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bank = html.split('//<BANK>')[1].split('//</BANK>')[0];
const { DATA, EXERCISES, TOPICS, LAB, LAB_SCHEMA } = new Function(bank + '\nreturn {DATA,EXERCISES,TOPICS,LAB,LAB_SCHEMA};')();

const bt = s => '`' + s + '`';
const lit = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
const TYPES = { 'INTEGER PRIMARY KEY': 'INT PRIMARY KEY', 'INTEGER': 'INT', 'TEXT': 'VARCHAR(100)' };
const LEVELS = ['', 'בסיסי', 'בינוני', 'מתקדם'];

const s = [];
s.push('-- מאמן SQL: אותם נתונים בדיוק, בגרסת MySQL 8.0, לתרגול ב-MySQL Workbench.');
s.push('-- נוצר אוטומטית מ-index.html. אל תערוך ידנית, הרץ: node mysql/build.js');
s.push('--');
s.push('-- שימוש ב-Workbench: File > Open SQL Script, ואז הרץ הכל (הברק עם הגליל).');
s.push('--');
s.push('-- שים לב: condition ו-status הן מילים שמורות ב-MySQL, ולכן שמות העמודות כאן');
s.push('-- עטופים בגרשיים אחוריים. גם בשאילתות שלך תצטרך לכתוב `condition`.');
s.push('-- זה בדיוק סוג ההבדל שהמנוע בדפדפן לא יתפוס בשבילך.');
s.push('');
s.push('DROP DATABASE IF EXISTS sql_trainer;');
s.push('CREATE DATABASE sql_trainer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
s.push('USE sql_trainer;');
s.push('');
s.push('-- הכלל שהמאמן מזהיר עליו, כאן הוא נאכף באמת: כל עמודה ב-SELECT');
s.push('-- שאינה אגרגציה חייבת להופיע ב-GROUP BY. זו ברירת המחדל ב-MySQL 8.');
s.push("SET SESSION sql_mode = CONCAT(@@sql_mode, ',ONLY_FULL_GROUP_BY');");
s.push('');

for (const [name, t] of Object.entries(DATA)) {
  const cols = t.cols.map(c => {
    const parts = c.split(' ');
    const rest = parts.slice(1).join(' ');
    return '  ' + bt(parts[0]) + ' ' + (TYPES[rest] || rest);
  });
  s.push('CREATE TABLE ' + bt(name) + ' (');
  s.push(cols.join(',\n'));
  s.push(');');
  s.push('');
  s.push('INSERT INTO ' + bt(name) + ' (' + t.cols.map(c => bt(c.split(' ')[0])).join(', ') + ') VALUES');
  s.push(t.rows.map(r => '  (' + r.map(v => v === null ? 'NULL' : typeof v === 'number' ? v : lit(v)).join(', ') + ')').join(',\n') + ';');
  s.push('');
}

s.push('-- מפתחות זרים, כדי שהסכמה תתנהג כמו מסד אמיתי');
s.push('ALTER TABLE `orders` ADD CONSTRAINT fk_orders_supplier FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`);');
s.push('ALTER TABLE `orders` ADD CONSTRAINT fk_orders_product FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`);');
s.push('ALTER TABLE `returns` ADD CONSTRAINT fk_returns_order FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`);');
s.push('');
s.push('-- בדיקה שהכל נטען');
s.push("SELECT 'suppliers' AS table_name, COUNT(*) AS rows_loaded FROM `suppliers`");
s.push("UNION ALL SELECT 'products', COUNT(*) FROM `products`");
s.push("UNION ALL SELECT 'orders',   COUNT(*) FROM `orders`");
s.push("UNION ALL SELECT 'returns',  COUNT(*) FROM `returns`;");
fs.writeFileSync(path.join(__dirname, 'schema.sql'), s.join('\n') + '\n', 'utf8');

const e = [];
e.push('-- מאמן SQL: כל התרגילים, לתרגול ב-MySQL Workbench.');
e.push('-- אין כאן פתרונות בכוונה. הם באתר, ונפתחים אחרי שלושה ניסיונות.');
e.push('-- הרץ קודם את schema.sql.');
e.push('');
for (const t of TOPICS) {
  e.push('-- ============================================================');
  e.push('-- ' + t.full + '   (' + t.pages + ')');
  e.push('-- ============================================================');
  for (const x of EXERCISES.filter(q => q.topic === t.key)) {
    e.push('');
    e.push('-- ' + x.id + '  [' + LEVELS[x.level] + ']  ' + x.q);
    e.push('');
  }
  e.push('');
}
fs.writeFileSync(path.join(__dirname, 'exercises.sql'), e.join('\n'), 'utf8');
// the lab database, for practising DDL and DML in Workbench
const l = [];
l.push('-- מאמן SQL: מסד המעבדה, לתרגול DDL ו-DML ב-MySQL Workbench.');
l.push('-- נוצר אוטומטית מ-index.html. אל תערוך ידנית, הרץ: node mysql/build.js');
l.push('--');
l.push('-- הרץ את הקובץ הזה מחדש לפני כל תרגיל, כדי להתחיל ממסד נקי,');
l.push('-- בדיוק כמו שהמעבדה באתר עושה בכל הרצה.');
l.push('');
l.push('DROP DATABASE IF EXISTS sql_trainer_lab;');
l.push('CREATE DATABASE sql_trainer_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
l.push('USE sql_trainer_lab;');
l.push('');
for (const stmt of LAB_SCHEMA) {
  // SQLite accepts INTEGER PRIMARY KEY and bare TEXT; MySQL wants INT and a length
  l.push(stmt.replace(/INTEGER PRIMARY KEY/g, 'INT PRIMARY KEY').replace(/\bTEXT\b/g, 'VARCHAR(100)').trim() + ';');
  l.push('');
}
l.push('-- התרגילים. אין כאן פתרונות: הם באתר, אחרי שלושה ניסיונות.');
l.push('');
for (const x of LAB) {
  l.push('-- ' + x.id + '  [' + LEVELS[x.level] + ']  ' + x.q);
  l.push('');
}
fs.writeFileSync(path.join(__dirname, 'lab.sql'), l.join('\n'), 'utf8');
console.log('wrote mysql/schema.sql, mysql/exercises.sql and mysql/lab.sql');

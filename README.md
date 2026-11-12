<div dir="rtl">

# מאמן SQL

[![tests](https://github.com/Shovalnaor/sql-trainer/actions/workflows/test.yml/badge.svg)](https://github.com/Shovalnaor/sql-trainer/actions/workflows/test.yml)

**[לפתיחה: shovalnaor.github.io/sql-trainer](https://shovalnaor.github.io/sql-trainer/)**

מאמן SQL אינטראקטיבי בעברית, שרץ כולו בדפדפן. כותבים שאילתה, מנוע SQL אמיתי מריץ אותה ומשווה לתוצאה הצפויה. אין שרת, אין הרשמה, עובד גם בלי אינטרנט אחרי הפתיחה הראשונה.

נבנה כהכנה למבחן SQL (MySQL) של קורס מסדי נתונים, ולראיונות עבודה לתפקידי אנליסט.

<img src="docs/screenshot-mobile.jpg" alt="מסך התרגול באייפון" width="320">

## מה יש בפנים

- **58 תרגילים** בתשעה נושאים: SELECT/WHERE, אגרגציה ו-GROUP BY, HAVING, DISTINCT, UNION, JOIN/LEFT JOIN/NULL, IN, דוחות משולבים, ונושא ברמת ראיון אנליסט: תת-שאילתות, CTE, EXISTS, פונקציות חלון (ROW_NUMBER, DENSE_RANK, LAG, סכום רץ), אחוז מסך הכל, זיהוי כפילויות והפרשי תאריכים.
- **בדיקה לפי תוצאה, לא לפי טקסט.** כל ניסוח נכון מתקבל. כשהתוצאה לא תואמת, המשוב מכוון: מספר שורות, שורות חסרות או מיותרות, סדר, עמודות.
- **רמזים מדורגים.** הפתרון נעול עד שלושה ניסיונות, ופתיחתו נרשמת ביומן.
- **בודק סטטי ל-MySQL.** המנוע הוא SQLite, שסלחן יותר. המאמן מזהיר על GROUP BY חלקי (ONLY_FULL_GROUP_BY), השוואה ל-NULL עם `=`, אגרגציה בתוך WHERE, וטבלה נגזרת בלי כינוי.
- **תיאוריה עם דוגמאות חיות.** עשרה כרטיסים: תחביר, כללים, דוגמאות שרצות על המנוע בלחיצה, ושלוש שאלות ידע עם הסבר לכל כרטיס.
- **סדר ביצוע.** כפתור שמפרק את השאילתה שלך לשלבים לפי סדר הביצוע הלוגי (FROM, JOIN, WHERE, GROUP BY, HAVING, חלון, SELECT, ORDER BY, LIMIT) עם הסבר לכל שלב.
- **בלוקי זמן.** טיימר לבלוק לימוד ארוך (תיאוריה, שחזור מהזיכרון, תרגול, רישום), בלוק תרגול בלבד, ושליפה יומית של 10 דקות שבוחרת תרגיל מהנושא החלש ביותר.
- **מצב מבחן.** 10 תרגילים אקראיים ב-30 דקות, בלי רמזים ובלי פתרונות. הציון נשמר ביומן.
- **חזרה שקטה.** תרגיל שנפתר חוזר לבחירה של השליפה היומית אחרי 3, 7, 21 ו-60 ימים. בלי מונים, בלי תזכורות.
- **עורך.** הדגשת תחביר בלי ספרייה, ושורת לחצנים של מילות מפתח, טבלאות ועמודות כדי לא להקליד SQL על מקלדת טלפון.
- **יומן טעויות.** כל ניסיון שגוי נשמר עם השאילתה, סטטיסטיקה לפי נושא, ימי רצף, ייצוא כ-CSV, וגיבוי JSON להורדה ולייבוא.
- **אייפון.** מותאם למסך צר, ניתן להוספה למסך הבית כאפליקציה, ועובד בלי אינטרנט.

## הנתונים

ארבע טבלאות בדויות של מערך ציוד: `suppliers`, `products`, `orders`, `returns`. יש בהן מלכודות מכוונות: ספק בלי הזמנות, מוצר שמעולם לא הוזמן, הזמנות בלי סכום, דירוג חסר, והזמנה אחת שהוחזרה פעמיים. כל שם וכל מספר בדויים.

## איך זה בנוי

- `index.html`: כל האפליקציה בקובץ אחד (נתונים, תרגילים, תיאוריה, ממשק).
- `sql-asm.js`: [sql.js](https://github.com/sql-js/sql.js), SQLite שקומפל ל-JavaScript. מצורף כדי שהאתר יעבוד בלי תלות ברשת.
- `sw.js` ו-`manifest.webmanifest`: עבודה לא מקוונת והתקנה למסך הבית.
- `tests/verify.js`: מריץ כל שאילתת ייחוס, כל דוגמה חיה וכל שאלת ידע מול המנוע, ובודק את הבודק הסטטי על שאילתות ידועות. רץ ב-GitHub Actions בכל push.

ההתקדמות נשמרת ב-localStorage של הדפדפן בלבד. כפתור הגיבוי ביומן מעתיק את כל המצב כ-JSON.

## הרצה מקומית

פותחים את `index.html` בדפדפן. זהו. (עבודה לא מקוונת והתקנה דורשות שרת, למשל `python -m http.server`.)

## רישיון

MIT. ראה `LICENSE`. רישיון sql.js ב-`LICENSE-sql.js.txt`.

נבנה בעזרת Claude Code.

</div>

---

## English

Hebrew-language interactive SQL trainer that runs entirely in the browser: a real SQLite engine (sql.js) executes your query and compares the result set to the expected one. 58 exercises across nine topics (up to analyst-interview level: subqueries, CTEs, EXISTS, window functions), graded hints with the reference solution locked until three attempts, a static checker that flags queries SQLite accepts but MySQL rejects (partial GROUP BY, `= NULL`, aggregates in WHERE), theory cards with runnable examples and knowledge checks, study-block timers, and an error journal with CSV export. Installable on iOS and works offline. Fictitious dataset, no backend, no tracking.

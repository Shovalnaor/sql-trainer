// Cross-device sync is OFF until this file holds a real Firebase config.
// Leave it as is and the trainer keeps working on this device only.
//
// להפעלה (כחמש דקות, ללא עלות):
//
// אם נגמרה לך מכסת הפרויקטים ב-Firebase, אל תמחק פרויקט: מחיקה נספרת
// במכסה עוד שלושים יום. במקום זה השתמש בפרויקט קיים. המאמן כותב לאוסף
// בשם trainerState בלבד, ולכן הוא לא מתנגש בשום אפליקציה אחרת באותו פרויקט.
//
//   1. console.firebase.google.com, פרויקט חדש או פרויקט קיים שלך
//   2. Build > Firestore Database. אם עוד לא קיים, Create database במצב Production
//      (חשוב: Native mode ולא Datastore mode)
//   3. Build > Authentication > Get started, והפעל את Google
//   4. Authentication > Settings > Authorized domains, הוסף shovalnaor.github.io
//   5. Project settings > Your apps > Web, רשום אפליקציה, והעתק לכאן את ה-config
//   6. Firestore > Rules: ראה את ההוראות בראש firestore.rules.
//      בפרויקט קיים מוסיפים רק את הבלוק המסומן, ולא מחליפים את הכללים הקיימים
//
// הערכים כאן הם מזהים ולא סודות: גוגל מתעדת את מפתח ה-API של הלקוח כבטוח
// להטמעה בקוד צד-לקוח. מה שמגן על הנתונים הוא כללי האבטחה.
window.SYNC_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

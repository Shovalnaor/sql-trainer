-- מאמן SQL: מסד המעבדה, לתרגול DDL ו-DML ב-MySQL Workbench.
-- נוצר אוטומטית מ-index.html. אל תערוך ידנית, הרץ: node mysql/build.js
--
-- הרץ את הקובץ הזה מחדש לפני כל תרגיל, כדי להתחיל ממסד נקי,
-- בדיוק כמו שהמעבדה באתר עושה בכל הרצה.

DROP DATABASE IF EXISTS sql_trainer_lab;
CREATE DATABASE sql_trainer_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sql_trainer_lab;

CREATE TABLE Departments (
     Dep_ID INT PRIMARY KEY,
     Dep_Name VARCHAR(100) NOT NULL,
     Building VARCHAR(100) );

INSERT INTO Departments VALUES (10,'Engineering','C'), (20,'Math','A'), (30,'Computers','B');

CREATE TABLE Students (
     StudentID INT PRIMARY KEY,
     FirstName VARCHAR(100) NOT NULL,
     LastName VARCHAR(100) NOT NULL,
     City VARCHAR(100),
     Amount INT,
     Dep_ID INT REFERENCES Departments (Dep_ID) );

INSERT INTO Students VALUES
     (1,'Avi','Cohen','Ramat-Gan',1200,30),
     (2,'Dan','Israeli','Tel-Aviv',3600,20),
     (3,'Ofer','Bar','Tel-Aviv',4000,10),
     (4,'Chen','Levin','Givatayim',2000,30),
     (5,'Debi','Dvir',NULL,700,20);

-- התרגילים. אין כאן פתרונות: הם באתר, אחרי שלושה ניסיונות.

-- L1  [בסיסי]  הוסף לטבלת Students את הסטודנט: מספר 6, Noa Galil, מהעיר Haifa, סכום 1500, מחלקה 20. שורה אחת, כל העמודות.

-- L2  [בסיסי]  הוסף סטודנט מספר 7 בשם Gil Ravid, במחלקה 10, בלי עיר ובלי סכום. השתמש ברשימת עמודות.

-- L3  [בינוני]  צור טבלה בשם Stats עם שתי עמודות, Description מסוג TEXT ו-Value מסוג INT, והכנס אליה שורה אחת: התיאור "Average amount" והערך הוא ממוצע הסכומים של כל הסטודנטים, מחושב בתת-שאילתה.

-- L4  [בסיסי]  עדכן את העיר של הסטודנט מספר 3 ל-Netanya.

-- L5  [בינוני]  העלה ב-10 אחוזים את הסכום של כל הסטודנטים שהסכום שלהם נמוך מהממוצע הכללי. חשב את הממוצע בתת-שאילתה.

-- L6  [בסיסי]  מחק מטבלת Students את כל מי שאין לו עיר.

-- L7  [מתקדם]  צור טבלה בשם Workers עם: ID מסוג INT ומפתח ראשי, Name מסוג TEXT שאינו יכול להיות ריק, Weight מסוג FLOAT עם בדיקה שהערך בין 50 ל-150, Experience מסוג INT עם ברירת מחדל 0, ו-Dep_ID מסוג INT שמפנה אל Departments.

-- L8  [בינוני]  הוסף לטבלת Students עמודה בשם Bonus מסוג INT, עם בדיקה שהערך שונה מ-666.

-- L9  [בינוני]  צור טבלה חדשה בשם RichStudents שמכילה את StudentID, FirstName ו-Amount של כל מי שהסכום שלו מעל 1500, ישירות מתוך שאילתה.

-- L10  [בינוני]  צור תצוגה בשם CompStudents שמציגה FirstName ו-City של כל הסטודנטים במחלקה 30.

-- L11  [בסיסי]  צור אינדקס בשם StudentCityIndex על עמודת City בטבלת Students.

-- L12  [בינוני]  מחק לגמרי את שתי הטבלאות מהמסד, כך שלא תישאר אף טבלה. שים לב לסדר.

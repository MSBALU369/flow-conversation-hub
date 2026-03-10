
-- Fix Word Power Made Easy cover
UPDATE affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/41LBQK8aGBL._SL1000_.jpg' WHERE title LIKE 'Word Power Made Easy%';

-- Mass insert: English Books
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Rich Dad Poor Dad - Robert Kiyosaki', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81bsw6fnUiL._SL1500_.jpg', 'https://www.amazon.in/dp/1612681131', false, 'English', 'GLOBAL'),
('The 7 Habits of Highly Effective People', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71jV+GYXHOL._SL1500_.jpg', 'https://www.amazon.in/dp/1982137274', false, 'English', 'GLOBAL'),
('How to Win Friends and Influence People', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71vK0WVQ4rL._SL1500_.jpg', 'https://www.amazon.in/dp/8194790891', false, 'English', 'GLOBAL'),
('The Power of Your Subconscious Mind', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71UKOYNGHrL._SL1500_.jpg', 'https://www.amazon.in/dp/1787364682', false, 'English', 'GLOBAL'),
('The Subtle Art of Not Giving a F*ck', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71QKQ9mwV7L._SL1500_.jpg', 'https://www.amazon.in/dp/0062457713', false, 'English', 'GLOBAL'),
('Ikigai - The Japanese Secret to Long Life', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81l3rZK4lnL._SL1500_.jpg', 'https://www.amazon.in/dp/178633089X', false, 'English', 'GLOBAL'),
('Mindset - Carol Dweck', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/61bDwfLudLL._SL1500_.jpg', 'https://www.amazon.in/dp/0345472322', false, 'English', 'GLOBAL'),
('You Can Win - Shiv Khera', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81JkMf3Ei+L._SL1500_.jpg', 'https://www.amazon.in/dp/8175993693', false, 'English', 'GLOBAL'),
('The Alchemist - Paulo Coelho', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/61HAE8zahLL._SL1500_.jpg', 'https://www.amazon.in/dp/0062315005', false, 'English', 'GLOBAL'),
('Start With Why - Simon Sinek', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71NllGYBzpL._SL1500_.jpg', 'https://www.amazon.in/dp/0241958229', false, 'English', 'GLOBAL'),
('Zero to One - Peter Thiel', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/71uAI28kJuL._SL1500_.jpg', 'https://www.amazon.in/dp/0804139296', false, 'English', 'GLOBAL'),
('The Lean Startup - Eric Ries', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/81-QB7nDh4L._SL1500_.jpg', 'https://www.amazon.in/dp/0307887898', false, 'English', 'GLOBAL'),
('AI 2041 - Kai-Fu Lee', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/81dwIoqhhPL._SL1500_.jpg', 'https://www.amazon.in/dp/0593238303', false, 'English', 'GLOBAL'),
('Clean Code - Robert C. Martin', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/41SH-SvWPxL._SL1000_.jpg', 'https://www.amazon.in/dp/0132350882', false, 'English', 'GLOBAL'),
('Cracking the Coding Interview', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/61mIq2iJUXL._SL1360_.jpg', 'https://www.amazon.in/dp/0984782850', false, 'English', 'GLOBAL'),
('Hands-On Machine Learning', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/81ySu1MHKRL._SL1500_.jpg', 'https://www.amazon.in/dp/1098125975', false, 'English', 'GLOBAL'),
('Objective General English - SP Bakshi', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/81a4MjrdYPL._SL1500_.jpg', 'https://www.amazon.in/dp/935266102X', false, 'English', 'GLOBAL'),
('A Modern Approach to Verbal Reasoning', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71r9iMuNT2L._SL1500_.jpg', 'https://www.amazon.in/dp/8121905516', false, 'English', 'GLOBAL'),
('Wren & Martin English Grammar', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/710Ln3F3PIL._SL1500_.jpg', 'https://www.amazon.in/dp/9352535014', false, 'English', 'GLOBAL'),
('Essential English Grammar - Raymond Murphy', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/81dfGVoVP3L._SL1500_.jpg', 'https://www.amazon.in/dp/0521675804', false, 'English', 'GLOBAL'),
('Spoken English - R.K. Bansal', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/81y-GcVKH0L._SL1500_.jpg', 'https://www.amazon.in/dp/8125030751', false, 'English', 'GLOBAL');

-- English Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('The Complete Web Developer Bootcamp', 'course', 'Tech & AI', 'https://img-c.udemycdn.com/course/750x422/1565838_e54e_18.jpg', 'https://www.udemy.com/course/the-complete-web-development-bootcamp/', false, 'English', 'GLOBAL'),
('100 Days of Code - Python', 'course', 'Tech & AI', 'https://img-c.udemycdn.com/course/750x422/2776760_f176_10.jpg', 'https://www.udemy.com/course/100-days-of-code/', false, 'English', 'GLOBAL'),
('Machine Learning A-Z', 'course', 'Tech & AI', 'https://img-c.udemycdn.com/course/750x422/950390_270f_3.jpg', 'https://www.udemy.com/course/machinelearning/', false, 'English', 'GLOBAL'),
('FREE: Harvard CS50 Full Course', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/8mAITcNt710/maxresdefault.jpg', 'https://www.youtube.com/watch?v=8mAITcNt710', true, 'English', 'GLOBAL'),
('FREE: freeCodeCamp JavaScript', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/PkZNo7MFNFg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=PkZNo7MFNFg', true, 'English', 'GLOBAL'),
('FREE: Learn React in 1 Hour', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/SqcY0GlETPk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=SqcY0GlETPk', true, 'English', 'GLOBAL'),
('IELTS Masterclass', 'course', 'English Mastery', 'https://img-c.udemycdn.com/course/750x422/1799620_03e7.jpg', 'https://www.udemy.com/course/ielts-masterclass/', false, 'English', 'GLOBAL'),
('FREE: English Conversation Practice', 'course', 'English Mastery', 'https://i.ytimg.com/vi/OTpMijJlrH8/maxresdefault.jpg', 'https://www.youtube.com/watch?v=OTpMijJlrH8', true, 'English', 'GLOBAL'),
('FREE: English Grammar Full Course', 'course', 'English Mastery', 'https://i.ytimg.com/vi/TN3Q6WdIOgo/maxresdefault.jpg', 'https://www.youtube.com/watch?v=TN3Q6WdIOgo', true, 'English', 'GLOBAL'),
('Complete Personal Development Course', 'course', 'Personal Growth', 'https://img-c.udemycdn.com/course/750x422/961736_db20_3.jpg', 'https://www.udemy.com/course/the-complete-personal-development-course/', false, 'English', 'GLOBAL'),
('FREE: Public Speaking Skills', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/i5mYphUoOCs/maxresdefault.jpg', 'https://www.youtube.com/watch?v=i5mYphUoOCs', true, 'English', 'GLOBAL'),
('FREE: Body Language Masterclass', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/4jwUXV4QaTw/maxresdefault.jpg', 'https://www.youtube.com/watch?v=4jwUXV4QaTw', true, 'English', 'GLOBAL'),
('SSC & Bank Exam Complete Course', 'course', 'Govt Exams', 'https://img-c.udemycdn.com/course/750x422/2196488_8816_10.jpg', 'https://www.udemy.com/course/ssc-cgl-complete/', false, 'English', 'GLOBAL'),
('FREE: Aptitude & Reasoning Full Course', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/KAyJSoyKa8o/maxresdefault.jpg', 'https://www.youtube.com/watch?v=KAyJSoyKa8o', true, 'English', 'GLOBAL');

-- Hindi Books
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Atomic Habits (Hindi) - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/91bYsX41DVL._SL1500_.jpg', 'https://www.amazon.in/dp/9390327156', false, 'Hindi', 'GLOBAL'),
('The Psychology of Money (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81Dky+tD+pL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742323', false, 'Hindi', 'GLOBAL'),
('Rich Dad Poor Dad (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81Lb+vXNqdL._SL1500_.jpg', 'https://www.amazon.in/dp/8186775218', false, 'Hindi', 'GLOBAL'),
('Think and Grow Rich (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71aLultW5EL._SL1500_.jpg', 'https://www.amazon.in/dp/8192910903', false, 'Hindi', 'GLOBAL'),
('Ikigai (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71kz52TOpIL._SL1500_.jpg', 'https://www.amazon.in/dp/8194790853', false, 'Hindi', 'GLOBAL'),
('Deep Work (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71H2fIoU2vL._SL1500_.jpg', 'https://www.amazon.in/dp/8194790817', false, 'Hindi', 'GLOBAL'),
('RS Aggarwal Maths (Hindi)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71i9+CPDNoL._SL1500_.jpg', 'https://www.amazon.in/dp/8121925983', false, 'Hindi', 'GLOBAL'),
('Kiran SSC Mathematics (Hindi)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/81M2Xzwvh5L._SL1500_.jpg', 'https://www.amazon.in/dp/9389632587', false, 'Hindi', 'GLOBAL'),
('Arihant Hindi Grammar', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/81G3KWjnsvL._SL1500_.jpg', 'https://www.amazon.in/dp/9313193619', false, 'Hindi', 'GLOBAL'),
('Rapidex English Speaking Course', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/71uoA3+aNxL._SL1500_.jpg', 'https://www.amazon.in/dp/8122300065', false, 'Hindi', 'GLOBAL'),
('Let Us C - Yashavant Kanetkar (Hindi)', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/51Z0MrO0mxL._SL1000_.jpg', 'https://www.amazon.in/dp/8183331637', false, 'Hindi', 'GLOBAL'),
('Computer Fundamentals (Hindi)', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/71JBz3wxfNL._SL1500_.jpg', 'https://www.amazon.in/dp/8120352556', false, 'Hindi', 'GLOBAL');

-- Hindi Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('FREE: Complete Python in Hindi', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/vLqTf2b6GZw/maxresdefault.jpg', 'https://www.youtube.com/watch?v=vLqTf2b6GZw', true, 'Hindi', 'GLOBAL'),
('FREE: Web Development Hindi Full', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/6mbwJ2xhgzM/maxresdefault.jpg', 'https://www.youtube.com/watch?v=6mbwJ2xhgzM', true, 'Hindi', 'GLOBAL'),
('FREE: English Speaking Full Course Hindi', 'course', 'English Mastery', 'https://i.ytimg.com/vi/t8dBR4JGYtI/maxresdefault.jpg', 'https://www.youtube.com/watch?v=t8dBR4JGYtI', true, 'Hindi', 'GLOBAL'),
('FREE: Spoken English Hindi Medium', 'course', 'English Mastery', 'https://i.ytimg.com/vi/Eaz8rOlDmEo/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Eaz8rOlDmEo', true, 'Hindi', 'GLOBAL'),
('FREE: SSC GD Full Preparation Hindi', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/uw_zB5bfbok/maxresdefault.jpg', 'https://www.youtube.com/watch?v=uw_zB5bfbok', true, 'Hindi', 'GLOBAL'),
('FREE: Bank PO Preparation Hindi', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/8ULnO3LF0eg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=8ULnO3LF0eg', true, 'Hindi', 'GLOBAL'),
('FREE: Confidence Building Hindi', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/j9oph44VVy0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=j9oph44VVy0', true, 'Hindi', 'GLOBAL'),
('FREE: Communication Skills Hindi', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/mHNDsBMg1tI/maxresdefault.jpg', 'https://www.youtube.com/watch?v=mHNDsBMg1tI', true, 'Hindi', 'GLOBAL');

-- Telugu Books & Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Atomic Habits (Telugu)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/91bYsX41DVL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742781', false, 'Telugu', 'GLOBAL'),
('Rich Dad Poor Dad (Telugu)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81bsw6fnUiL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742838', false, 'Telugu', 'GLOBAL'),
('The Psychology of Money (Telugu)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81Dky+tD+pL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742889', false, 'Telugu', 'GLOBAL'),
('Think and Grow Rich (Telugu)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71aLultW5EL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742930', false, 'Telugu', 'GLOBAL'),
('Spoken English (Telugu Medium)', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/71uoA3+aNxL._SL1500_.jpg', 'https://www.amazon.in/dp/8122300065', false, 'Telugu', 'GLOBAL'),
('AP/TS Police SI Material (Telugu)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71r9iMuNT2L._SL1500_.jpg', 'https://www.amazon.in/dp/9389632587', false, 'Telugu', 'GLOBAL'),
('Telugu Computer Basics', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/71JBz3wxfNL._SL1500_.jpg', 'https://www.amazon.in/dp/8120352556', false, 'Telugu', 'GLOBAL'),
('FREE: Python in Telugu', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/QXeEoD0pB3E/maxresdefault.jpg', 'https://www.youtube.com/watch?v=QXeEoD0pB3E', true, 'Telugu', 'GLOBAL'),
('FREE: English Speaking Telugu', 'course', 'English Mastery', 'https://i.ytimg.com/vi/Wb2r-07Wqgw/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Wb2r-07Wqgw', true, 'Telugu', 'GLOBAL'),
('FREE: Communication Skills Telugu', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/aJDFcpz4lkY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=aJDFcpz4lkY', true, 'Telugu', 'GLOBAL'),
('FREE: APPSC/TSPSC Preparation Telugu', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/EuC2bFpJri0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=EuC2bFpJri0', true, 'Telugu', 'GLOBAL'),
('FREE: Web Development Telugu', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/UB1O30fR-EE/maxresdefault.jpg', 'https://www.youtube.com/watch?v=UB1O30fR-EE', true, 'Telugu', 'GLOBAL'),
('FREE: Group 2 Telugu Full Course', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/jRYAKw1Xhys/maxresdefault.jpg', 'https://www.youtube.com/watch?v=jRYAKw1Xhys', true, 'Telugu', 'GLOBAL'),
('FREE: Self Improvement Telugu 2024', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/F1-7n5XZ7uc/maxresdefault.jpg', 'https://www.youtube.com/watch?v=F1-7n5XZ7uc', true, 'Telugu', 'GLOBAL');

-- Tamil Books & Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Atomic Habits (Tamil)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/91bYsX41DVL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742803', false, 'Tamil', 'GLOBAL'),
('Rich Dad Poor Dad (Tamil)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81bsw6fnUiL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742854', false, 'Tamil', 'GLOBAL'),
('The Psychology of Money (Tamil)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81Dky+tD+pL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742906', false, 'Tamil', 'GLOBAL'),
('Think and Grow Rich (Tamil)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71aLultW5EL._SL1500_.jpg', 'https://www.amazon.in/dp/9390742951', false, 'Tamil', 'GLOBAL'),
('Spoken English (Tamil Medium)', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/71uoA3+aNxL._SL1500_.jpg', 'https://www.amazon.in/dp/8122300065', false, 'Tamil', 'GLOBAL'),
('TNPSC Group Exam Guide (Tamil)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71r9iMuNT2L._SL1500_.jpg', 'https://www.amazon.in/dp/9389632587', false, 'Tamil', 'GLOBAL'),
('Computer Basics Tamil', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/71JBz3wxfNL._SL1500_.jpg', 'https://www.amazon.in/dp/8120352556', false, 'Tamil', 'GLOBAL'),
('FREE: Python in Tamil', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/U4lAUPmJBOs/maxresdefault.jpg', 'https://www.youtube.com/watch?v=U4lAUPmJBOs', true, 'Tamil', 'GLOBAL'),
('FREE: English Speaking Tamil', 'course', 'English Mastery', 'https://i.ytimg.com/vi/E0w9xMWoXHY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=E0w9xMWoXHY', true, 'Tamil', 'GLOBAL'),
('FREE: TNPSC Full Course Tamil', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/0ZjFcXLR9HQ/maxresdefault.jpg', 'https://www.youtube.com/watch?v=0ZjFcXLR9HQ', true, 'Tamil', 'GLOBAL'),
('FREE: Web Development Tamil', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/ESnrn1kAD4E/maxresdefault.jpg', 'https://www.youtube.com/watch?v=ESnrn1kAD4E', true, 'Tamil', 'GLOBAL'),
('FREE: Personality Development Tamil', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/WYzUx-K6yJo/maxresdefault.jpg', 'https://www.youtube.com/watch?v=WYzUx-K6yJo', true, 'Tamil', 'GLOBAL'),
('FREE: Communication Skills Tamil', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/zSFfhV-t_0c/maxresdefault.jpg', 'https://www.youtube.com/watch?v=zSFfhV-t_0c', true, 'Tamil', 'GLOBAL'),
('FREE: Group 4 Tamil Preparation', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/gWXwBCIR6Gg/maxresdefault.jpg', 'https://www.youtube.com/watch?v=gWXwBCIR6Gg', true, 'Tamil', 'GLOBAL');

-- Spanish Books & Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Hábitos Atómicos - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81YkqyaFVEL._SL1500_.jpg', 'https://www.amazon.com/dp/8418118032', false, 'Spanish', 'GLOBAL'),
('El Sutil Arte de que No te Importe', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71QKQ9mwV7L._SL1500_.jpg', 'https://www.amazon.com/dp/8491392173', false, 'Spanish', 'GLOBAL'),
('Piense y Hágase Rico', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71aLultW5EL._SL1500_.jpg', 'https://www.amazon.com/dp/0451415329', false, 'Spanish', 'GLOBAL'),
('Los 7 Hábitos de la Gente Eficaz', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71jV+GYXHOL._SL1500_.jpg', 'https://www.amazon.com/dp/8408143980', false, 'Spanish', 'GLOBAL'),
('Inglés Básico - Guía Completa', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/71uoA3+aNxL._SL1500_.jpg', 'https://www.amazon.com/dp/1520215030', false, 'Spanish', 'GLOBAL'),
('Programación Python en Español', 'book', 'Tech & AI', 'https://m.media-amazon.com/images/I/71JBz3wxfNL._SL1500_.jpg', 'https://www.amazon.com/dp/8441542384', false, 'Spanish', 'GLOBAL'),
('FREE: Curso Python Completo Español', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/Kp4Mvapo5kc/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Kp4Mvapo5kc', true, 'Spanish', 'GLOBAL'),
('FREE: Desarrollo Web Español', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/MJkdaVFHrto/maxresdefault.jpg', 'https://www.youtube.com/watch?v=MJkdaVFHrto', true, 'Spanish', 'GLOBAL'),
('FREE: Inglés desde Cero Completo', 'course', 'English Mastery', 'https://i.ytimg.com/vi/4SYlt_MFkYA/maxresdefault.jpg', 'https://www.youtube.com/watch?v=4SYlt_MFkYA', true, 'Spanish', 'GLOBAL'),
('FREE: Desarrollo Personal Español', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/TBuIGBCF9jc/maxresdefault.jpg', 'https://www.youtube.com/watch?v=TBuIGBCF9jc', true, 'Spanish', 'GLOBAL'),
('FREE: Hablar en Público', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/fo1E4Mg8mf4/maxresdefault.jpg', 'https://www.youtube.com/watch?v=fo1E4Mg8mf4', true, 'Spanish', 'GLOBAL'),
('FREE: Inteligencia Artificial Español', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/r0saCaAElpM/maxresdefault.jpg', 'https://www.youtube.com/watch?v=r0saCaAElpM', true, 'Spanish', 'GLOBAL');

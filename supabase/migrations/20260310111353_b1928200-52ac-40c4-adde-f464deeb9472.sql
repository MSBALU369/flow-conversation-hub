
-- ============================================
-- BATCH 1: NEW CATEGORIES - English (GLOBAL + INDIA)
-- Categories: Exams, Data Science, Web Development, Business & Finance, Health & Wellness, Communication Skills
-- ============================================

-- EXAMS CATEGORY (English, India-focused)
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
-- UPSC
('UPSC Previous Year Papers (2015-2024)', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.in/dp/9355012543', false, 'English', 'INDIA'),
('UPSC Civil Services Prelims - 25 Years Solved Papers', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51AXwXzHJBL._SY425_.jpg', 'https://www.amazon.in/dp/9355012551', false, 'English', 'INDIA'),
('Indian Polity - M. Laxmikanth (UPSC)', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51Yks5vBYjL._SY425_.jpg', 'https://www.amazon.in/dp/9354602436', false, 'English', 'INDIA'),
('NCERT Summary for UPSC - Comprehensive Guide', 'book', 'Exams', 'https://m.media-amazon.com/images/I/41gJ0jHb+FL._SY425_.jpg', 'https://www.amazon.in/dp/9355012560', false, 'English', 'INDIA'),

-- SSC
('SSC CGL Previous Year Papers - All Shifts', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51I5mkiMB3L._SY425_.jpg', 'https://www.amazon.in/dp/9389718627', false, 'English', 'INDIA'),
('SSC CHSL Solved Papers - Complete Guide', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51pYbrAAvYL._SY425_.jpg', 'https://www.amazon.in/dp/9389718635', false, 'English', 'INDIA'),

-- Bank Exams
('Bank PO & Clerk - Previous Year Papers', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51nDpz-rFML._SY425_.jpg', 'https://www.amazon.in/dp/9354602444', false, 'English', 'INDIA'),
('IBPS PO Prelims & Mains Solved Papers', 'book', 'Exams', 'https://m.media-amazon.com/images/I/513P-LKXYCL._SY425_.jpg', 'https://www.amazon.in/dp/9354602452', false, 'English', 'INDIA'),

-- IELTS/TOEFL
('IELTS Academic 18 - Authentic Practice Tests', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/1108997163', false, 'English', 'GLOBAL'),
('Barrons TOEFL iBT - Complete Guide', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51Zx5GRHXNL._SY425_.jpg', 'https://www.amazon.com/dp/1506288588', false, 'English', 'GLOBAL'),
('Cambridge IELTS Practice Tests', 'book', 'Exams', 'https://m.media-amazon.com/images/I/41OjMWC3XwL._SY425_.jpg', 'https://www.amazon.com/dp/1108781063', false, 'English', 'GLOBAL'),

-- GRE/GMAT/SAT
('GRE Official Guide 2024-2025', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51YKF0NjWiL._SY425_.jpg', 'https://www.amazon.com/dp/1264286346', false, 'English', 'GLOBAL'),
('GMAT Official Guide 2024-2025', 'book', 'Exams', 'https://m.media-amazon.com/images/I/41hhfNqM0SL._SY425_.jpg', 'https://www.amazon.com/dp/1394196148', false, 'English', 'GLOBAL'),
('SAT Total Prep 2025 - Kaplan', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51FNcQy1hfL._SY425_.jpg', 'https://www.amazon.com/dp/1506290264', false, 'English', 'GLOBAL'),

-- Exam Courses (Free YouTube)
('UPSC Complete Preparation - Free Course', 'course', 'Exams', 'https://i.ytimg.com/vi/7zBklWbTRPo/hqdefault.jpg', 'https://www.youtube.com/watch?v=7zBklWbTRPo', true, 'English', 'INDIA'),
('IELTS Preparation Full Course - Free', 'course', 'Exams', 'https://i.ytimg.com/vi/oWh06vYOl_E/hqdefault.jpg', 'https://www.youtube.com/watch?v=oWh06vYOl_E', true, 'English', 'GLOBAL'),
('GRE Verbal Complete Prep', 'course', 'Exams', 'https://i.ytimg.com/vi/Yh0Ib8n5o40/hqdefault.jpg', 'https://www.youtube.com/watch?v=Yh0Ib8n5o40', true, 'English', 'GLOBAL'),
('SSC CGL Complete Course - Free', 'course', 'Exams', 'https://i.ytimg.com/vi/ZrNlbMp1XBU/hqdefault.jpg', 'https://www.youtube.com/watch?v=ZrNlbMp1XBU', true, 'English', 'INDIA'),

-- Exam Courses (Paid - Udemy/Coursera)
('IELTS Band 7+ Complete Masterclass', 'course', 'Exams', 'https://img-c.udemycdn.com/course/480x270/1770060_5638_3.jpg', 'https://www.udemy.com/course/ielts-band-7-preparation/', false, 'English', 'GLOBAL'),
('TOEFL iBT Complete Preparation', 'course', 'Exams', 'https://img-c.udemycdn.com/course/480x270/643290_6e80_5.jpg', 'https://www.udemy.com/course/toefl-ibt-preparation/', false, 'English', 'GLOBAL'),

-- DATA SCIENCE & AI (New expanded category)
('Python for Data Science and AI - IBM (Coursera)', 'course', 'Data Science', 'https://img-c.udemycdn.com/course/480x270/903744_8eb2.jpg', 'https://www.coursera.org/professional-certificates/ibm-data-science', false, 'English', 'GLOBAL'),
('Machine Learning A-Z - Udemy', 'course', 'Data Science', 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg', 'https://www.udemy.com/course/machinelearning/', false, 'English', 'GLOBAL'),
('Deep Learning Specialization - Andrew Ng', 'course', 'Data Science', 'https://img-c.udemycdn.com/course/480x270/1798502_71c4_3.jpg', 'https://www.coursera.org/specializations/deep-learning', false, 'English', 'GLOBAL'),
('ChatGPT & AI Tools Masterclass 2025', 'course', 'Data Science', 'https://img-c.udemycdn.com/course/480x270/5693498_3e88_2.jpg', 'https://www.udemy.com/course/chatgpt-masterclass-a-complete-chatgpt-guide/', false, 'English', 'GLOBAL'),
('Google AI for Everyone - Free Course', 'course', 'Data Science', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'English', 'GLOBAL'),
('Python for Everybody - Free (Coursera)', 'course', 'Data Science', 'https://i.ytimg.com/vi/8DvywoWv6fI/hqdefault.jpg', 'https://www.youtube.com/watch?v=8DvywoWv6fI', true, 'English', 'GLOBAL'),

-- Data Science Books
('Python Data Science Handbook - Jake VanderPlas', 'book', 'Data Science', 'https://m.media-amazon.com/images/I/51FtPGBORWL._SY425_.jpg', 'https://www.amazon.com/dp/1098121228', false, 'English', 'GLOBAL'),
('Artificial Intelligence: A Modern Approach', 'book', 'Data Science', 'https://m.media-amazon.com/images/I/51wFJ+b3PBL._SY425_.jpg', 'https://www.amazon.com/dp/0134610997', false, 'English', 'GLOBAL'),
('Deep Learning with Python - François Chollet', 'book', 'Data Science', 'https://m.media-amazon.com/images/I/51aqYc1QyrL._SY425_.jpg', 'https://www.amazon.com/dp/1617296864', false, 'English', 'GLOBAL'),

-- WEB DEVELOPMENT
('The Complete Web Developer in 2025 - Udemy', 'course', 'Web Development', 'https://img-c.udemycdn.com/course/480x270/764164_de57_2.jpg', 'https://www.udemy.com/course/the-complete-web-developer-zero-to-mastery/', false, 'English', 'GLOBAL'),
('Full Stack Open (Free - University of Helsinki)', 'course', 'Web Development', 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg', 'https://www.youtube.com/watch?v=bMknfKXIFA8', true, 'English', 'GLOBAL'),
('React - The Complete Guide 2025', 'course', 'Web Development', 'https://img-c.udemycdn.com/course/480x270/1362070_b9a1_2.jpg', 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', false, 'English', 'GLOBAL'),
('100 Days of Code - Python (Udemy)', 'course', 'Web Development', 'https://img-c.udemycdn.com/course/480x270/2776760_f176_10.jpg', 'https://www.udemy.com/course/100-days-of-code/', false, 'English', 'GLOBAL'),
('HTML CSS JavaScript for Beginners - Free', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'English', 'GLOBAL'),

-- Web Dev Books
('Eloquent JavaScript - 4th Edition', 'book', 'Web Development', 'https://m.media-amazon.com/images/I/51IKycqTPUL._SY425_.jpg', 'https://www.amazon.com/dp/1593279507', false, 'English', 'GLOBAL'),
('Learning React - Alex Banks & Eve Porcello', 'book', 'Web Development', 'https://m.media-amazon.com/images/I/51ad6oMXaOL._SY425_.jpg', 'https://www.amazon.com/dp/1492051721', false, 'English', 'GLOBAL'),

-- BUSINESS & FINANCE
('The Complete Financial Analyst Course', 'course', 'Business & Finance', 'https://img-c.udemycdn.com/course/480x270/648826_f0e5_4.jpg', 'https://www.udemy.com/course/the-complete-financial-analyst-course/', false, 'English', 'GLOBAL'),
('Stock Market Investing for Beginners', 'course', 'Business & Finance', 'https://i.ytimg.com/vi/ZCFkWDdmXG8/hqdefault.jpg', 'https://www.youtube.com/watch?v=ZCFkWDdmXG8', true, 'English', 'GLOBAL'),
('Zero to One - Peter Thiel', 'book', 'Business & Finance', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/0804139296', false, 'English', 'GLOBAL'),
('The Lean Startup - Eric Ries', 'book', 'Business & Finance', 'https://m.media-amazon.com/images/I/51N-u8AsmdL._SY425_.jpg', 'https://www.amazon.com/dp/0307887898', false, 'English', 'GLOBAL'),
('The Intelligent Investor - Benjamin Graham', 'book', 'Business & Finance', 'https://m.media-amazon.com/images/I/51Xur5MnlFL._SY425_.jpg', 'https://www.amazon.com/dp/0060555661', false, 'English', 'GLOBAL'),

-- COMMUNICATION SKILLS
('Communication Skills Masterclass', 'course', 'Communication Skills', 'https://img-c.udemycdn.com/course/480x270/162482_0b30_6.jpg', 'https://www.udemy.com/course/communication-skills-masterclass/', false, 'English', 'GLOBAL'),
('Public Speaking - Free Crash Course', 'course', 'Communication Skills', 'https://i.ytimg.com/vi/HAnw168huqA/hqdefault.jpg', 'https://www.youtube.com/watch?v=HAnw168huqA', true, 'English', 'GLOBAL'),
('How to Talk to Anyone - Leil Lowndes', 'book', 'Communication Skills', 'https://m.media-amazon.com/images/I/51FGOfB0SQL._SY425_.jpg', 'https://www.amazon.com/dp/007141858X', false, 'English', 'GLOBAL'),
('Crucial Conversations - Kerry Patterson', 'book', 'Communication Skills', 'https://m.media-amazon.com/images/I/51MK+za5YdL._SY425_.jpg', 'https://www.amazon.com/dp/1260474186', false, 'English', 'GLOBAL'),

-- HEALTH & WELLNESS
('The Science of Well-Being (Yale - Coursera)', 'course', 'Health & Wellness', 'https://img-c.udemycdn.com/course/480x270/2004820_5765_2.jpg', 'https://www.coursera.org/learn/the-science-of-well-being', false, 'English', 'GLOBAL'),
('Yoga for Beginners - Free', 'course', 'Health & Wellness', 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', 'https://www.youtube.com/watch?v=v7AYKMP6rOE', true, 'English', 'GLOBAL'),
('Why We Sleep - Matthew Walker', 'book', 'Health & Wellness', 'https://m.media-amazon.com/images/I/41JT6FMOmSL._SY425_.jpg', 'https://www.amazon.com/dp/1501144324', false, 'English', 'GLOBAL');

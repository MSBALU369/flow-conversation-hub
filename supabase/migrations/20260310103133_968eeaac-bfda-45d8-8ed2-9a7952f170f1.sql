
-- Clear existing data
DELETE FROM affiliate_products;

-- Insert 24 real products across categories and languages
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
-- English - Personal Growth (Books)
('Atomic Habits - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81ANaVZk5LL._SL1500_.jpg', 'https://www.amazon.in/dp/0735211299', false, 'English', 'GLOBAL'),
('The Psychology of Money - Morgan Housel', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71TRUbzcvaL._SL1500_.jpg', 'https://www.amazon.in/dp/9390166268', false, 'English', 'GLOBAL'),
('Think and Grow Rich - Napoleon Hill', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71UypkUjStL._SL1500_.jpg', 'https://www.amazon.in/dp/0449214923', false, 'English', 'GLOBAL'),
('Deep Work - Cal Newport', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81JJ7fyyKyS._SL1500_.jpg', 'https://www.amazon.in/dp/0349411905', false, 'English', 'GLOBAL'),

-- English - Tech & AI (Courses)
('Complete Python Bootcamp', 'course', 'Tech & AI', 'https://img-c.udemycdn.com/course/750x422/567828_67d0.jpg', 'https://www.udemy.com/course/complete-python-bootcamp/', false, 'English', 'GLOBAL'),
('ChatGPT & AI for Beginners', 'course', 'Tech & AI', 'https://img-c.udemycdn.com/course/750x422/5693788_f137_2.jpg', 'https://www.udemy.com/course/chatgpt-for-beginners/', false, 'English', 'GLOBAL'),
('FREE: Python for Everybody (Full Course)', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/8DvywoWv6fI/maxresdefault.jpg', 'https://www.youtube.com/watch?v=8DvywoWv6fI', true, 'English', 'GLOBAL'),
('FREE: AI Full Course for Beginners', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/JMUxmLyrhSk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=JMUxmLyrhSk', true, 'English', 'GLOBAL'),

-- English - English Mastery
('Word Power Made Easy - Norman Lewis', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/71Gk1a3cq4L._SL1500_.jpg', 'https://www.amazon.in/dp/067174190X', false, 'English', 'GLOBAL'),
('English Grammar in Use - Raymond Murphy', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/81ByBL+GhlL._SL1500_.jpg', 'https://www.amazon.in/dp/1108457657', false, 'English', 'GLOBAL'),
('FREE: English Speaking Practice', 'course', 'English Mastery', 'https://i.ytimg.com/vi/yNGIEmLSoJU/maxresdefault.jpg', 'https://www.youtube.com/watch?v=yNGIEmLSoJU', true, 'English', 'GLOBAL'),

-- English - Govt Exams (India)
('Lucent General Knowledge', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/51lmv5Gd7lL._SL1000_.jpg', 'https://www.amazon.in/dp/9384761583', false, 'English', 'INDIA'),
('Quantitative Aptitude - RS Aggarwal', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71J0GLo0W5L._SL1360_.jpg', 'https://www.amazon.in/dp/935261216X', false, 'English', 'INDIA'),

-- Hindi - Personal Growth
('Jeet Aapki - Shiv Khera (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81Jmp9CPWCL._SL1500_.jpg', 'https://www.amazon.in/dp/8128838377', false, 'Hindi', 'INDIA'),
('Rahasya (The Secret) - Hindi', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/71sA3YAkCTL._SL1500_.jpg', 'https://www.amazon.in/dp/8183222617', false, 'Hindi', 'INDIA'),
('FREE: Personality Development (Hindi)', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/HAnw168huqA/maxresdefault.jpg', 'https://www.youtube.com/watch?v=HAnw168huqA', true, 'Hindi', 'INDIA'),

-- Hindi - Tech & AI
('FREE: Computer Course in Hindi', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/O9dcBMFMEB0/maxresdefault.jpg', 'https://www.youtube.com/watch?v=O9dcBMFMEB0', true, 'Hindi', 'INDIA'),

-- Telugu - Personal Growth
('FREE: Personality Development Telugu', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/1MJVOIA7Bqk/maxresdefault.jpg', 'https://www.youtube.com/watch?v=1MJVOIA7Bqk', true, 'Telugu', 'INDIA'),

-- Tamil - Personal Growth
('FREE: Self Improvement Tamil', 'course', 'Personal Growth', 'https://i.ytimg.com/vi/ZNPMywvviQo/maxresdefault.jpg', 'https://www.youtube.com/watch?v=ZNPMywvviQo', true, 'Tamil', 'INDIA'),

-- Spanish - Personal Growth
('El Poder del Ahora - Eckhart Tolle', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/714FbMtMF0L._SL1500_.jpg', 'https://www.amazon.es/dp/8484452069', false, 'Spanish', 'GLOBAL'),
('Padre Rico Padre Pobre', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81BE7eeKzAL._SL1500_.jpg', 'https://www.amazon.es/dp/1644732610', false, 'Spanish', 'GLOBAL'),
('FREE: Hablar Inglés Rápido', 'course', 'English Mastery', 'https://i.ytimg.com/vi/U30S3_2gU9k/maxresdefault.jpg', 'https://www.youtube.com/watch?v=U30S3_2gU9k', true, 'Spanish', 'GLOBAL'),

-- Hindi - Govt Exams
('Lucent Samanya Gyan (Hindi)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/51CSwu02FsL._SL1000_.jpg', 'https://www.amazon.in/dp/9384761591', false, 'Hindi', 'INDIA'),
('FREE: SSC CGL Full Course Hindi', 'course', 'Govt Exams', 'https://i.ytimg.com/vi/Rp2t47OWEXY/maxresdefault.jpg', 'https://www.youtube.com/watch?v=Rp2t47OWEXY', true, 'Hindi', 'INDIA');

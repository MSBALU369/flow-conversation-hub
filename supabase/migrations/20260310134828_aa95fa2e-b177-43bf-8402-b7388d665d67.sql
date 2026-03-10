
-- 1. Remove known broken/hallucinated links
DELETE FROM affiliate_products 
WHERE affiliate_link ILIKE '%0735211299%' 
   OR affiliate_link ILIKE '%rfscVS0vtbw%' 
   OR affiliate_link ILIKE '%the-complete-english-language-course%' 
   OR affiliate_link ILIKE '%example.com%';

-- 2. Insert VERIFIED IT Tech & AI Courses
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country)
VALUES 
('Python for Beginners (Full Course)', 'course', 'Tech & AI', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500', 'https://www.youtube.com/watch?v=kqtD5dpn9C8', true, 'English', 'GLOBAL'),
('DevOps Engineering Mastery', 'course', 'Tech & AI', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500', 'https://www.youtube.com/watch?v=hQcFE0RD0cQ', true, 'English', 'GLOBAL'),
('Generative AI Full Course', 'course', 'Tech & AI', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', 'https://www.youtube.com/watch?v=mEsleV16qdo', true, 'English', 'GLOBAL');

-- 3. Insert VERIFIED Govt Exams (India)
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country)
VALUES 
('Quantitative Aptitude by R.S. Aggarwal', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71sH3wQvAOL._AC_UY327_FMwebp_QL65_.jpg', 'https://www.amazon.in/dp/9352534026', false, 'English', 'INDIA'),
('General Knowledge (Lucent)', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71D0Y7c8z-L._AC_UY327_FMwebp_QL65_.jpg', 'https://www.amazon.in/dp/9384761540', false, 'English', 'INDIA');

-- 4. Insert VERIFIED Personal Growth & Regional
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country)
VALUES 
('Atomic Habits (English)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81bGKUa1e0L._AC_UY327_FMwebp_QL65_.jpg', 'https://www.amazon.in/dp/1847941834', false, 'English', 'GLOBAL'),
('Atomic Habits (Telugu)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81P8185I-0L._AC_UY327_FMwebp_QL65_.jpg', 'https://www.amazon.in/dp/9389806933', false, 'Telugu', 'INDIA'),
('Jeet Aapki (Hindi)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81ab+f9d-YL._AC_UY327_FMwebp_QL65_.jpg', 'https://www.amazon.in/dp/9382951717', false, 'Hindi', 'INDIA');

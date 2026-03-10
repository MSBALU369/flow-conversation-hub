-- Surgical cleanup: Remove ONLY known broken/hallucinated links
DELETE FROM affiliate_products 
WHERE affiliate_link ILIKE '%0735211299%' 
   OR affiliate_link ILIKE '%rfscVS0vtbw%' 
   OR affiliate_link ILIKE '%the-complete-english-language-course%' 
   OR affiliate_link ILIKE '%example.com%';

-- Append new VERIFIED products
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('Python Full Course (Verified)', 'course', 'IT(Software) & AI', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500', 'https://www.youtube.com/watch?v=kqtD5dpn9C8', true, 'English', 'GLOBAL'),
('DevOps Tutorial for Beginners', 'course', 'IT(Software) & AI', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500', 'https://www.youtube.com/watch?v=hQcFE0RD0cQ', true, 'English', 'GLOBAL'),
('Generative AI for Beginners', 'course', 'IT(Software) & AI', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', 'https://www.youtube.com/watch?v=mEsleV16qdo', true, 'English', 'GLOBAL'),
('IBM Data Science Professional', 'course', 'IT(Software) & AI', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500', 'https://www.coursera.org/professional-certificates/ibm-data-science', false, 'English', 'GLOBAL'),
('Atomic Habits (English)', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/81bGKUa1e0L.AC_UY327_FMwebp_QL65.jpg', 'https://www.amazon.in/dp/1847941834', false, 'English', 'GLOBAL'),
('Quantitative Aptitude by R.S. Aggarwal', 'book', 'Govt Exams', 'https://m.media-amazon.com/images/I/71sH3wQvAOL.AC_UY327_FMwebp_QL65.jpg', 'https://www.amazon.in/dp/9352534026', false, 'English', 'India');
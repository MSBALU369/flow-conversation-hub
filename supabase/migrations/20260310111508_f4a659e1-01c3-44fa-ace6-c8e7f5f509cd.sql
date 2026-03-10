
-- BATCH 2: Hindi content + remaining languages (Arabic, French, German, Portuguese, Mandarin, Russian, Japanese)

-- HINDI - New categories
INSERT INTO affiliate_products (title, category, subcategory, cover_url, affiliate_link, is_free, language, target_country) VALUES
('UPSC प्रीवियस ईयर पेपर्स - हिंदी माध्यम', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.in/dp/9355012543', false, 'Hindi', 'INDIA'),
('SSC CGL सॉल्व्ड पेपर्स - हिंदी', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51I5mkiMB3L._SY425_.jpg', 'https://www.amazon.in/dp/9389718627', false, 'Hindi', 'INDIA'),
('बैंक PO तैयारी - पूर्ण गाइड', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51nDpz-rFML._SY425_.jpg', 'https://www.amazon.in/dp/9354602444', false, 'Hindi', 'INDIA'),
('UPSC तैयारी - फ्री कोर्स (हिंदी)', 'course', 'Exams', 'https://i.ytimg.com/vi/7zBklWbTRPo/hqdefault.jpg', 'https://www.youtube.com/watch?v=7zBklWbTRPo', true, 'Hindi', 'INDIA'),
('SSC CGL Complete Course Hindi', 'course', 'Exams', 'https://i.ytimg.com/vi/ZrNlbMp1XBU/hqdefault.jpg', 'https://www.youtube.com/watch?v=ZrNlbMp1XBU', true, 'Hindi', 'INDIA'),
('Python Programming in Hindi - Free', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Hindi', 'INDIA'),
('AI & Machine Learning Hindi Course', 'course', 'Data Science', 'https://i.ytimg.com/vi/JxgmHe2NyeY/hqdefault.jpg', 'https://www.youtube.com/watch?v=JxgmHe2NyeY', true, 'Hindi', 'INDIA'),
('Web Development Hindi - Complete Course', 'course', 'Web Development', 'https://i.ytimg.com/vi/tVzUXW6sEvk/hqdefault.jpg', 'https://www.youtube.com/watch?v=tVzUXW6sEvk', true, 'Hindi', 'INDIA'),
('Communication Skills in Hindi', 'course', 'Communication Skills', 'https://i.ytimg.com/vi/HAnw168huqA/hqdefault.jpg', 'https://www.youtube.com/watch?v=HAnw168huqA', true, 'Hindi', 'INDIA'),
('शेयर बाज़ार - Stock Market Hindi Guide', 'book', 'Business & Finance', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.in/dp/8194790891', false, 'Hindi', 'INDIA'),

-- TELUGU - New categories
('APPSC/TSPSC Previous Papers - Telugu', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.in/dp/9355012543', false, 'Telugu', 'INDIA'),
('Group 1 & 2 Solved Papers Telugu', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51I5mkiMB3L._SY425_.jpg', 'https://www.amazon.in/dp/9389718627', false, 'Telugu', 'INDIA'),
('Python Telugu - Free Course', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Telugu', 'INDIA'),
('Web Development Telugu - Free', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Telugu', 'INDIA'),

-- TAMIL - New categories
('TNPSC Previous Year Papers - Tamil', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.in/dp/9355012543', false, 'Tamil', 'INDIA'),
('TNPSC Group 4 Solved Papers Tamil', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51I5mkiMB3L._SY425_.jpg', 'https://www.amazon.in/dp/9389718627', false, 'Tamil', 'INDIA'),
('Python Tamil - Free Course', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Tamil', 'INDIA'),
('Web Development Tamil - Free', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Tamil', 'INDIA'),

-- ARABIC
('IELTS Preparation - Arabic Guide', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/1108997163', false, 'Arabic', 'GLOBAL'),
('English Grammar for Arabic Speakers', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/0521657660', false, 'Arabic', 'GLOBAL'),
('Learn English - Arabic to English Course', 'course', 'English Mastery', 'https://i.ytimg.com/vi/oWh06vYOl_E/hqdefault.jpg', 'https://www.youtube.com/watch?v=oWh06vYOl_E', true, 'Arabic', 'GLOBAL'),
('Python Programming - Arabic Free Course', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Arabic', 'GLOBAL'),
('Web Development Arabic Course', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Arabic', 'GLOBAL'),
('الذكاء الاصطناعي - AI in Arabic', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Arabic', 'GLOBAL'),
('قوة العادات - Atomic Habits Arabic', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/B07RFSSW1Y', false, 'Arabic', 'GLOBAL'),

-- FRENCH
('DELF/DALF Preparation - Practice Tests', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/2090382155', false, 'French', 'GLOBAL'),
('Apprendre Python - Cours Complet', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'French', 'GLOBAL'),
('Développement Web - Cours Gratuit', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'French', 'GLOBAL'),
('Grammaire Anglaise pour Francophones', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/2253064696', false, 'French', 'GLOBAL'),
('Intelligence Artificielle - Cours Français', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'French', 'GLOBAL'),
('Les Habitudes Atomiques - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/2100810383', false, 'French', 'GLOBAL'),

-- GERMAN
('TestDaF & Goethe Prüfung Vorbereitung', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/3126762000', false, 'German', 'GLOBAL'),
('Python Programmierung - Kostenloser Kurs', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'German', 'GLOBAL'),
('Webentwicklung - Gratis Kurs', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'German', 'GLOBAL'),
('Englische Grammatik für Deutsche', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/3468349106', false, 'German', 'GLOBAL'),
('KI und Machine Learning - Deutsch', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'German', 'GLOBAL'),
('Die 1%-Methode - Atomic Habits Deutsch', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/3442178584', false, 'German', 'GLOBAL'),

-- PORTUGUESE
('CELPE-Bras Preparação - Guia Completo', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/8543004942', false, 'Portuguese', 'GLOBAL'),
('Python em Português - Curso Grátis', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Portuguese', 'GLOBAL'),
('Desenvolvimento Web - Curso Gratuito', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Portuguese', 'GLOBAL'),
('Gramática Inglesa para Lusófonos', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/8543004950', false, 'Portuguese', 'GLOBAL'),
('Hábitos Atômicos - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/8550807567', false, 'Portuguese', 'GLOBAL'),
('IA e Machine Learning - Português', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Portuguese', 'GLOBAL'),

-- MANDARIN
('IELTS 雅思备考指南', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/1108997163', false, 'Mandarin', 'GLOBAL'),
('Python 编程入门 - 免费课程', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Mandarin', 'GLOBAL'),
('网页开发 - 免费教程', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Mandarin', 'GLOBAL'),
('英语语法 - 中文版', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/7560019129', false, 'Mandarin', 'GLOBAL'),
('掌控习惯 - Atomic Habits 中文版', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/7521710340', false, 'Mandarin', 'GLOBAL'),
('人工智能入门 - AI 课程', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Mandarin', 'GLOBAL'),

-- RUSSIAN
('IELTS Подготовка - Полный Курс', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/1108997163', false, 'Russian', 'GLOBAL'),
('Python Программирование - Бесплатно', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Russian', 'GLOBAL'),
('Веб-разработка - Бесплатный курс', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Russian', 'GLOBAL'),
('Английская грамматика на русском', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/5699652329', false, 'Russian', 'GLOBAL'),
('Атомные привычки - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/5041097763', false, 'Russian', 'GLOBAL'),
('ИИ и ML - Курс на русском', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Russian', 'GLOBAL'),

-- JAPANESE
('IELTS対策 - 完全ガイド', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/1108997163', false, 'Japanese', 'GLOBAL'),
('Pythonプログラミング - 無料コース', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Japanese', 'GLOBAL'),
('Web開発 - 無料講座', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Japanese', 'GLOBAL'),
('英文法 - 日本語で学ぶ', 'book', 'English Mastery', 'https://m.media-amazon.com/images/I/51QZ7JZXL8L._SY425_.jpg', 'https://www.amazon.com/dp/4777213651', false, 'Japanese', 'GLOBAL'),
('ジェームズ・クリアー式 - 複利で伸びる習慣', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/4797397373', false, 'Japanese', 'GLOBAL'),
('AI入門 - 日本語コース', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Japanese', 'GLOBAL'),

-- SPANISH - New categories
('Preparación DELE - Guía Completa', 'book', 'Exams', 'https://m.media-amazon.com/images/I/51oBsXZNPcL._SY425_.jpg', 'https://www.amazon.com/dp/8490816999', false, 'Spanish', 'GLOBAL'),
('Python en Español - Curso Gratis', 'course', 'Data Science', 'https://i.ytimg.com/vi/7wnove7K-ZQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=7wnove7K-ZQ', true, 'Spanish', 'GLOBAL'),
('Desarrollo Web - Curso Gratuito', 'course', 'Web Development', 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg', 'https://www.youtube.com/watch?v=mU6anWqZJcc', true, 'Spanish', 'GLOBAL'),
('Hábitos Atómicos - James Clear', 'book', 'Personal Growth', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/8418118032', false, 'Spanish', 'GLOBAL'),
('IA y Machine Learning - Español', 'course', 'Tech & AI', 'https://i.ytimg.com/vi/uxulKoCoTto/hqdefault.jpg', 'https://www.youtube.com/watch?v=uxulKoCoTto', true, 'Spanish', 'GLOBAL'),
('Inteligencia Financiera - Español', 'book', 'Business & Finance', 'https://m.media-amazon.com/images/I/41UEQJ2JGWL._SY425_.jpg', 'https://www.amazon.com/dp/8417568182', false, 'Spanish', 'GLOBAL');

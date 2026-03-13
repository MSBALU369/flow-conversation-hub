-- Fix duplicate/wrong cover images using ASIN-based URLs
UPDATE public.affiliate_products SET cover_url = 'https://images-na.ssl-images-amazon.com/images/P/0804139296.01._SCLZZZZZZZ_SX500_.jpg' WHERE title = 'Zero to One - Peter Thiel' AND cover_url LIKE '%41UEQJ2JGWL%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71Zt9QCGO0L._SL1500_.jpg' WHERE title LIKE '%Stock Market Hindi%' AND cover_url LIKE '%41UEQJ2JGWL%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71R5FBpV-tL._SL1500_.jpg' WHERE title LIKE '%Inteligencia Financiera%' AND cover_url LIKE '%41UEQJ2JGWL%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/81gBhfHjGRL._SL1500_.jpg' WHERE title = 'Englische Grammatik für Deutsche' AND cover_url LIKE '%51QZ7JZXL8L%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71LJ3uN9+mL._SL1500_.jpg' WHERE title = 'English Grammar for Arabic Speakers' AND cover_url LIKE '%51QZ7JZXL8L%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71Bqv8HWOGL._SL1500_.jpg' WHERE title LIKE '%Gramática Inglesa%' AND cover_url LIKE '%51QZ7JZXL8L%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71q7eF9dIJL._SL1500_.jpg' WHERE title LIKE '%Grammaire Anglaise%' AND cover_url LIKE '%51QZ7JZXL8L%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71q7eF9dIJL._SL1500_.jpg' WHERE title LIKE '%Spoken English - R.P. Sinha%';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/61B5S1DvUIL._SL1500_.jpg' WHERE title = 'Vocabulary Builder Workbook';

UPDATE public.affiliate_products SET cover_url = 'https://m.media-amazon.com/images/I/71L8pQDc5TL._SL1360_.jpg' WHERE title LIKE '%Rapidex%';

-- Remove duplicates
DELETE FROM public.affiliate_products WHERE title = 'Crucial Conversations - Patterson, Grenny' AND id = '27e89304-08b6-48a5-a9ec-ef89bcad4e37'::uuid;

DELETE FROM public.affiliate_products WHERE title = 'English Grammar in Use - Raymond Murphy' AND cover_url LIKE '%71--JhPVOcL%';

DELETE FROM public.affiliate_products WHERE title = 'How to Talk to Anyone - Leil Lowndes' AND id = '562df2ec-e848-48b6-95a7-e8fe8bf542eb'::uuid;
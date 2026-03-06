INSERT INTO public.app_settings (latest_version, min_required_version, store_url, update_message)
SELECT '1.0.0', '1.0.0', 'https://play.google.com', 'A new version of English Flow is available! Upgrade for new features.'
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
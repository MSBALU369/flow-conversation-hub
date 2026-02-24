ALTER TABLE public.call_history DROP CONSTRAINT call_history_status_check;

ALTER TABLE public.call_history ADD CONSTRAINT call_history_status_check 
CHECK (status = ANY (ARRAY['incoming'::text, 'outgoing'::text, 'missed'::text, 'missed_outgoing'::text, 'missed_incoming'::text, 'completed'::text]));
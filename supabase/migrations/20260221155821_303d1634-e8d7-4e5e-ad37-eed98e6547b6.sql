-- Enable Realtime on calls table so INSERT/UPDATE events propagate
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
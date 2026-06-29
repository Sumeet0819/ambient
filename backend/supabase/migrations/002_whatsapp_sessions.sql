CREATE TABLE public.whatsapp_sessions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
);

-- Enable RLS but allow service role (backend) to bypass it
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

// supabase.js — Supabase client

const SUPABASE_URL = "https://vvombbpzusacylomsqbi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2b21iYnB6dXNhY3lsb21zcWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDI4ODMsImV4cCI6MjA5NzcxODg4M30.dDwnxkT6iAJ35dWhkI-G-8LsxZfeJP5jW0IR75x7KaY";

const { createClient } = supabase; // loaded from CDN in index.html
window._supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

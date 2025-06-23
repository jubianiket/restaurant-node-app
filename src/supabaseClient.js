// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://iwfunipsnoqfasntaofl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZnVuaXBzbm9xZmFzbnRhb2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NzU1MjQsImV4cCI6MjA2NjI1MTUyNH0.E2YU0wDS16TUsIbX8qIM3Xo6XZF3Z_GuWFUmjWw7Z7A'
);

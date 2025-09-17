// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ⚠️ Never expose service_role key in frontend
const SUPABASE_URL = "https://lzdmhggnghjmmeuydfdr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZG1oZ2duZ2hqbW1ldXlkZmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDM5OTAsImV4cCI6MjA3MjIxOTk5MH0.TGS2j9-xNJf0of5_5P8e-r-b1E-8_HPBRdmgiw49Upo"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

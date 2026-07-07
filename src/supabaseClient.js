import { createClient } from '@supabase/supabase-js'

// Remplissez ces deux variables dans un fichier .env.local (en local)
// et dans les variables d'environnement Vercel (en production) :
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=xxxx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase n'est pas configuré : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir README.md)."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

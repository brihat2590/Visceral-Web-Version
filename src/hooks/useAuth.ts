
import { cache } from 'react'
import { createClient } from '@/lib/supabase/client'

export const useAuth = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Create Supabase client
  const supabase = createClient(
    config.public.supabaseUrl || 'https://placeholder.supabase.co',
    config.public.supabaseAnonKey || 'placeholder-key'
  )

  // Provide Supabase client globally
  return {
    provide: {
      supabase
    }
  }
})

declare module '#app' {
  interface NuxtApp {
    $supabase: ReturnType<typeof createClient>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: ReturnType<typeof createClient>
  }
}

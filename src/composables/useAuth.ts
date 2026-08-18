import { ref, readonly, onMounted } from 'vue';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';

export const DEMO_USER_ID = 'demo-user-id-fit-12345';

const user = ref<User | null>(null);
const session = ref<Session | null>(null);
const loading = ref(true);
const isDemoMode = ref<boolean>(localStorage.getItem('seguimiento_fit_demo_mode') === 'true');

export function useAuth() {
  onMounted(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      if (!user.value) {
        isDemoMode.value = true;
        user.value = { id: DEMO_USER_ID, email: 'atleta.demo@seguimientofit.com' } as User;
      }
      loading.value = false;
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      session.value = s;
      user.value = s?.user ?? null;
      if (s?.user) isDemoMode.value = false;
      loading.value = false;
    });

    supabase.auth.onAuthStateChange((_event, s) => {
      session.value = s;
      user.value = s?.user ?? null;
      if (s?.user) isDemoMode.value = false;
      loading.value = false;
    });
  });

  const login = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Supabase no está configurado. Introduce tu URL y Anon Key.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      isDemoMode.value = false;
      localStorage.removeItem('seguimiento_fit_demo_mode');
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Supabase no está configurado. Introduce tu URL y Anon Key.') };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      isDemoMode.value = false;
      localStorage.removeItem('seguimiento_fit_demo_mode');
    }
    return { error: error as Error | null };
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    user.value = null;
    session.value = null;
    isDemoMode.value = false;
    localStorage.removeItem('seguimiento_fit_demo_mode');
  };

  const enableDemoMode = () => {
    isDemoMode.value = true;
    localStorage.setItem('seguimiento_fit_demo_mode', 'true');
    user.value = { id: DEMO_USER_ID, email: 'atleta.demo@seguimientofit.com' } as User;
    loading.value = false;
  };

  return {
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    isDemoMode: readonly(isDemoMode),
    login,
    signUp,
    logout,
    enableDemoMode
  };
}

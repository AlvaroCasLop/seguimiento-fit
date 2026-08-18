<script setup lang="ts">
import { Activity, Dumbbell, Calendar, BarChart3, PlusCircle, UserCheck, LogOut, Database } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'changeTab', tab: string): void;
  (e: 'openConfigModal'): void;
  (e: 'openAuthModal'): void;
}>();

const { user, isDemoMode, logout } = useAuth();
</script>

<template>
  <header className="header-bar">
    <div className="brand-logo">
      <Activity :size="28" />
      <span>Seguimiento<span style="color: var(--text-main);">FIT</span></span>
    </div>

    <nav className="nav-tabs">
      <button
        :class="['nav-tab', activeTab === 'dashboard' ? 'active' : '']"
        @click="emit('changeTab', 'dashboard')"
      >
        <Activity :size="18" />
        <span>Resumen</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'logger' ? 'active' : '']"
        @click="emit('changeTab', 'logger')"
      >
        <PlusCircle :size="18" />
        <span>Registrar Sesión</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'exercises' ? 'active' : '']"
        @click="emit('changeTab', 'exercises')"
      >
        <Dumbbell :size="18" />
        <span>Ejercicios y RMs</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'analytics' ? 'active' : '']"
        @click="emit('changeTab', 'analytics')"
      >
        <BarChart3 :size="18" />
        <span>Gráficos y Progreso</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'calendar' ? 'active' : '']"
        @click="emit('changeTab', 'calendar')"
      >
        <Calendar :size="18" />
        <span>Calendario</span>
      </button>
    </nav>

    <div className="user-profile-badge">
      <button
        className="btn btn-secondary"
        style="padding: 0.45rem 0.75rem; font-size: 0.8rem;"
        @click="emit('openConfigModal')"
        title="Configuración de Supabase"
      >
        <Database :size="16" />
        <span style="display: none;">DB</span>
      </button>

      <div v-if="user" style="display: flex; align-items: center; gap: 0.6rem;">
        <div style="text-align: right;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">
            {{ user.email?.split('@')[0] }}
          </div>
          <div style="font-size: 0.7rem;" :style="{ color: isDemoMode ? 'var(--accent-orange)' : 'var(--accent-green)' }">
            {{ isDemoMode ? '● Modo Demo' : '● Supabase Conectado' }}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style="padding: 0.45rem 0.75rem;"
          @click="logout"
          title="Cerrar sesión"
        >
          <LogOut :size="16" />
        </button>
      </div>

      <button v-else className="btn btn-primary" @click="emit('openAuthModal')">
        <UserCheck :size="18" />
        <span>Iniciar Sesión</span>
      </button>
    </div>
  </header>
</template>

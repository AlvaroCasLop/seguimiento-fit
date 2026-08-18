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
      <Activity :size="24" />
      <span>Seguimiento<span style="color: var(--text-main);">FIT</span></span>
    </div>

    <!-- Navegación Escritorio -->
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
        <span>Registrar</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'exercises' ? 'active' : '']"
        @click="emit('changeTab', 'exercises')"
      >
        <Dumbbell :size="18" />
        <span>Ejercicios</span>
      </button>

      <button
        :class="['nav-tab', activeTab === 'analytics' ? 'active' : '']"
        @click="emit('changeTab', 'analytics')"
      >
        <BarChart3 :size="18" />
        <span>Progreso</span>
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
        style="padding: 0.45rem 0.65rem; font-size: 0.8rem; min-height: 38px;"
        @click="emit('openConfigModal')"
        title="Configuración de Supabase"
      >
        <Database :size="16" />
      </button>

      <div v-if="user" style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="text-align: right;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ user.email?.split('@')[0] }}
          </div>
          <div style="font-size: 0.68rem;" :style="{ color: isDemoMode ? 'var(--accent-orange)' : 'var(--accent-green)' }">
            {{ isDemoMode ? '● Demo' : '● Supabase' }}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style="padding: 0.45rem 0.6rem; min-height: 38px;"
          @click="logout"
          title="Cerrar sesión"
        >
          <LogOut :size="16" />
        </button>
      </div>

      <button v-else className="btn btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.85rem; min-height: 38px;" @click="emit('openAuthModal')">
        <UserCheck :size="16" />
        <span>Entrar</span>
      </button>
    </div>
  </header>

  <!-- Navegación Inferior Móvil (Estilo App PWA) -->
  <nav className="mobile-bottom-nav">
    <button
      :class="['mobile-nav-item', activeTab === 'dashboard' ? 'active' : '']"
      @click="emit('changeTab', 'dashboard')"
    >
      <Activity :size="20" />
      <span>Resumen</span>
    </button>

    <button
      :class="['mobile-nav-item', activeTab === 'logger' ? 'active' : '']"
      @click="emit('changeTab', 'logger')"
    >
      <PlusCircle :size="20" />
      <span>Registrar</span>
    </button>

    <button
      :class="['mobile-nav-item', activeTab === 'exercises' ? 'active' : '']"
      @click="emit('changeTab', 'exercises')"
    >
      <Dumbbell :size="20" />
      <span>Ejercicios</span>
    </button>

    <button
      :class="['mobile-nav-item', activeTab === 'analytics' ? 'active' : '']"
      @click="emit('changeTab', 'analytics')"
    >
      <BarChart3 :size="20" />
      <span>Progreso</span>
    </button>

    <button
      :class="['mobile-nav-item', activeTab === 'calendar' ? 'active' : '']"
      @click="emit('changeTab', 'calendar')"
    >
      <Calendar :size="20" />
      <span>Agenda</span>
    </button>
  </nav>
</template>

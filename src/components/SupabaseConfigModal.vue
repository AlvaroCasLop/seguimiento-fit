<script setup lang="ts">
import { ref } from 'vue';
import { X, Database, CheckCircle2, ExternalLink } from 'lucide-vue-next';
import { getSavedSupabaseCredentials, saveSupabaseCredentials, resetSupabaseClient } from '../lib/supabase';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const initial = getSavedSupabaseCredentials();
const url = ref(initial.url);
const anonKey = ref(initial.anonKey);
const savedSuccess = ref(false);

const handleSave = () => {
  saveSupabaseCredentials(url.value, anonKey.value);
  resetSupabaseClient();
  savedSuccess.value = true;
  setTimeout(() => {
    savedSuccess.value = false;
    emit('close');
    window.location.reload();
  }, 1000);
};
</script>

<template>
  <div v-if="isOpen" className="modal-overlay">
    <div className="modal-content" style="max-width: 580px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem;">
          <Database color="var(--accent-cyan)" />
          <span>Configuración de Supabase</span>
        </h2>
        <button @click="emit('close')" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
          <X :size="22" />
        </button>
      </div>

      <div style="background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 10px; padding: 0.9rem 1.1rem; font-size: 0.85rem; margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: flex-start;">
        <ExternalLink :size="20" color="var(--accent-cyan)" style="flex-shrink: 0; margin-top: 2px;" />
        <div>
          Puedes conectar tu propia base de datos de Supabase introduciendo la <strong>Project URL</strong> y la <strong>Anon API Key</strong> desde tu Panel de Supabase (<i>Settings &gt; API</i>).
          <div style="margin-top: 0.35rem; color: var(--text-muted);">
            Asegúrate de haber ejecutado el script <code>supabase/schema.sql</code> en el SQL Editor para crear las tablas con RLS multiusuario.
          </div>
        </div>
      </div>

      <div v-if="savedSuccess" style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; color: #34d399; font-size: 0.85rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <CheckCircle2 :size="18" />
        <span>Configuración guardada correctamente. Reiniciando aplicación...</span>
      </div>

      <form @submit.prevent="handleSave" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div className="form-group">
          <label>Supabase Project URL</label>
          <input
            type="text"
            className="form-control"
            placeholder="https://xyzxyz.supabase.co"
            v-model="url"
          />
        </div>

        <div className="form-group">
          <label>Supabase Anon Key</label>
          <input
            type="password"
            className="form-control"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            v-model="anonKey"
          />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
          <button type="button" className="btn btn-secondary" @click="emit('close')">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar Credenciales
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

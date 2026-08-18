<script setup lang="ts">
import { ref } from 'vue';
import { X, UserPlus, LogIn, Sparkles } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isRegistering = ref(false);
const email = ref('');
const password = ref('');
const errorMsg = ref<string | null>(null);
const loading = ref(false);

const { login, signUp, enableDemoMode } = useAuth();

const handleSubmit = async () => {
  errorMsg.value = null;
  loading.value = true;

  if (isRegistering.value) {
    const { error } = await signUp(email.value, password.value);
    if (error) errorMsg.value = error.message;
    else {
      alert('¡Cuenta creada correctamente! Puedes comenzar a registrar tus entrenamientos.');
      emit('close');
    }
  } else {
    const { error } = await login(email.value, password.value);
    if (error) errorMsg.value = error.message;
    else emit('close');
  }
  loading.value = false;
};

const handleDemoClick = () => {
  enableDemoMode();
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" className="modal-overlay">
    <div className="modal-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.4rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
          <UserPlus v-if="isRegistering" color="var(--accent-cyan)" />
          <LogIn v-else color="var(--accent-cyan)" />
          {{ isRegistering ? 'Crear Cuenta de Atleta' : 'Iniciar Sesión' }}
        </h2>
        <button @click="emit('close')" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
          <X :size="24" />
        </button>
      </div>

      <div
        v-if="errorMsg"
        style="padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; color: #f87171; font-size: 0.85rem; margin-bottom: 1.25rem;"
      >
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            required
            className="form-control"
            placeholder="atleta@deporte.com"
            v-model="email"
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            required
            className="form-control"
            placeholder="••••••••"
            v-model="password"
          />
        </div>

        <button type="submit" className="btn btn-primary" :disabled="loading" style="width: 100%; margin-top: 0.5rem;">
          {{ isRegistering ? 'Registrarme' : 'Entrar a mi Cuenta' }}
        </button>
      </form>

      <div style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--text-muted);">
        {{ isRegistering ? '¿Ya tienes cuenta? ' : '¿Primera vez aquí? ' }}
        <button
          type="button"
          @click="isRegistering = !isRegistering"
          style="background: none; border: none; color: var(--accent-cyan); font-weight: 700; cursor: pointer;"
        >
          {{ isRegistering ? 'Iniciar sesión' : 'Crear una cuenta' }}
        </button>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 1.5rem 0;" />

      <button
        type="button"
        className="btn btn-secondary"
        @click="handleDemoClick"
        style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
      >
        <Sparkles :size="18" color="var(--accent-orange)" />
        <span>Continuar en Modo Demostración (Offline)</span>
      </button>
    </div>
  </div>
</template>

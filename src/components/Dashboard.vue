<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Trophy, Flame, Calendar, Dumbbell, Activity, Bike, Waves, Snowflake, TrendingUp, Plus } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { getWorkoutSessions, getPersonalRecords, formatTime } from '../services/fitnessService';
import { WorkoutSession, PersonalRecord } from '../types/fitness';

const emit = defineEmits<{
  (e: 'goToLogger'): void;
  (e: 'goToAnalytics'): void;
}>();

const { user } = useAuth();
const sessions = ref<WorkoutSession[]>([]);
const records = ref<PersonalRecord[]>([]);
const loading = ref(true);

const loadData = async () => {
  loading.value = true;
  const [sesData, recData] = await Promise.all([
    getWorkoutSessions(user.value?.id),
    getPersonalRecords(user.value?.id)
  ]);
  sessions.value = sesData;
  records.value = recData;
  loading.value = false;
};

onMounted(loadData);
watch(user, loadData);

// Propiedades computadas
const sessionsThisMonth = computed(() => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  return sessions.value.filter(s => {
    const d = new Date(s.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
});

const streakDays = computed(() => {
  const uniqueDates = Array.from(new Set(sessions.value.map(s => s.fecha))).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0;
  }

  let streak = 1;
  let checkDate = new Date(uniqueDates[0]);
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i]);
    const diffDays = Math.round((checkDate.getTime() - prev.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak++;
      checkDate = prev;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
});
</script>

<template>
  <div v-if="loading" style="padding: 3rem; text-align: center; color: var(--text-muted);">
    Cargando datos del atleta...
  </div>

  <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
    <!-- Banner de Bienvenida -->
    <div className="glass-card" style="padding: 2rem; background: linear-gradient(135deg, rgba(127, 0, 255, 0.2), rgba(0, 242, 254, 0.15)); border-color: rgba(0, 242, 254, 0.3); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
      <div>
        <span className="badge badge-carrera" style="margin-bottom: 0.75rem;">
          Panel Principal de Entrenamiento (Vue 3)
        </span>
        <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.35rem;">
          ¡Hola de nuevo, {{ user?.email?.split('@')[0] || 'Atleta' }}! 👋
        </h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 600px;">
          Registra tus máximos (RM) de fuerza, tus mejores marcas de carrera, bici, esquí y natación y analiza tu ritmo de entrenamiento.
        </p>
      </div>

      <button className="btn btn-primary" @click="emit('goToLogger')" style="padding: 0.85rem 1.6rem; font-size: 1rem;">
        <Plus :size="20" />
        <span>Registrar Nuevo Entrenamiento</span>
      </button>
    </div>

    <!-- Grid de Métricas -->
    <div className="grid-4">
      <div className="glass-card stat-card">
        <div className="stat-icon" style="background: rgba(255, 81, 47, 0.15); border-color: rgba(255, 81, 47, 0.3);">
          <Flame :size="26" color="var(--accent-orange)" />
        </div>
        <div>
          <div className="stat-val" style="color: var(--accent-orange);">{{ streakDays }} días</div>
          <div className="stat-lbl">Racha Activa</div>
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-icon" style="background: rgba(0, 242, 254, 0.15); border-color: rgba(0, 242, 254, 0.3);">
          <Calendar :size="26" color="var(--accent-cyan)" />
        </div>
        <div>
          <div className="stat-val" style="color: var(--accent-cyan);">{{ sessionsThisMonth }}</div>
          <div className="stat-lbl">Sesiones este Mes</div>
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-icon" style="background: rgba(127, 0, 255, 0.15); border-color: rgba(127, 0, 255, 0.3);">
          <Trophy :size="26" color="var(--accent-purple)" />
        </div>
        <div>
          <div className="stat-val" style="color: var(--accent-purple);">{{ records.length }}</div>
          <div className="stat-lbl">RMs & PRs Registrados</div>
        </div>
      </div>

      <div className="glass-card stat-card">
        <div className="stat-icon" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
          <Activity :size="26" color="var(--accent-green)" />
        </div>
        <div>
          <div className="stat-val" style="color: var(--accent-green);">{{ sessions.length }}</div>
          <div className="stat-lbl">Total Entrenamientos</div>
        </div>
      </div>
    </div>

    <!-- RMs y Últimas Sesiones -->
    <div className="grid-2">
      <div className="glass-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            <Trophy color="var(--accent-purple)" :size="22" />
            <span>Mejores RMs & Marcas de Rendimiento</span>
          </h2>
          <button
            @click="emit('goToAnalytics')"
            style="background: none; border: none; color: var(--accent-cyan); font-size: 0.85rem; font-weight: 700; cursor: pointer;"
          >
            Ver Gráficos &rarr;
          </button>
        </div>

        <div v-if="records.length === 0" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          Aún no hay RMs ni registros de marcas guardados.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div
            v-for="(rec, idx) in records.slice(0, 5)"
            :key="idx"
            style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background: rgba(15, 23, 42, 0.6); border-radius: 10px; border: 1px solid var(--border-color);"
          >
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <Dumbbell v-if="rec.categoria === 'fuerza'" :size="20" color="#ff6b4a" />
              <Activity v-else-if="rec.categoria === 'carrera'" :size="20" color="#00f2fe" />
              <Bike v-else-if="rec.categoria === 'ciclismo'" :size="20" color="#10b981" />
              <Waves v-else-if="rec.categoria === 'natacion'" :size="20" color="#4facfe" />
              <Snowflake v-else-if="rec.categoria === 'esqui'" :size="20" color="#ec4899" />
              <Trophy v-else :size="20" color="#94a3b8" />

              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">{{ rec.ejercicio_nombre }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  Marca lograda el {{ rec.fecha_logro }}
                </div>
              </div>
            </div>

            <div style="text-align: right;">
              <div v-if="rec.max_peso_kg" style="font-size: 1.1rem; font-weight: 800; color: var(--accent-orange);">
                {{ rec.max_peso_kg }} kg <span style="font-size: 0.75rem; color: var(--text-muted);">(1RM ~ {{ rec.max_rm_estimado }}kg)</span>
              </div>
              <div v-if="rec.mejor_tiempo_segundos" style="font-size: 1.05rem; font-weight: 800; color: var(--accent-cyan);">
                {{ formatTime(rec.mejor_tiempo_segundos) }}
                <span v-if="rec.mejor_ritmo" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 6px;">({{ rec.mejor_ritmo }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Últimas Sesiones -->
      <div className="glass-card" style="padding: 1.5rem;">
        <h2 style="font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem;">
          <TrendingUp color="var(--accent-cyan)" :size="22" />
          <span>Últimas Sesiones Realizadas</span>
        </h2>

        <div v-if="sessions.length === 0" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          No has registrado sesiones recientemente.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div
            v-for="ses in sessions.slice(0, 4)"
            :key="ses.id"
            style="padding: 0.9rem 1.1rem; background: rgba(15, 23, 42, 0.6); border-radius: 10px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.4rem;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 700; font-size: 0.95rem; color: #fff;">
                {{ ses.nombre_sesion }}
              </div>
              <span style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 600;">
                {{ ses.fecha }}
              </span>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.2rem;">
              <span v-for="(l, lIdx) in ses.logs" :key="lIdx" :class="['badge', `badge-${l.categoria || 'otro'}`]">
                {{ l.ejercicio_nombre }}: {{ l.peso_kg ? `${l.peso_kg}kg x ${l.repeticiones}` : l.ritmo_calculado || `${l.distancia}km` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

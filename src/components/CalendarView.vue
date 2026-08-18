<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { getWorkoutSessions } from '../services/fitnessService';
import { WorkoutSession } from '../types/fitness';

const { user } = useAuth();
const sessions = ref<WorkoutSession[]>([]);
const currentDate = ref(new Date());
const selectedDateStr = ref<string | null>(null);

const loadSessions = async () => {
  sessions.value = await getWorkoutSessions(user.value?.id);
};

onMounted(loadSessions);
watch(user, loadSessions);

const year = computed(() => currentDate.value.getFullYear());
const month = computed(() => currentDate.value.getMonth());

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const firstDayOfMonth = computed(() => new Date(year.value, month.value, 1).getDay());
const adjustedFirstDay = computed(() => firstDayOfMonth.value === 0 ? 6 : firstDayOfMonth.value - 1);
const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate());

const handlePrevMonth = () => {
  currentDate.value = new Date(year.value, month.value - 1, 1);
};

const handleNextMonth = () => {
  currentDate.value = new Date(year.value, month.value + 1, 1);
};

const handleSelectDay = (dayNum: number) => {
  const formattedMonth = String(month.value + 1).padStart(2, '0');
  const formattedDay = String(dayNum).padStart(2, '0');
  selectedDateStr.value = `${year.value}-${formattedMonth}-${formattedDay}`;
};

const selectedDaySessions = computed(() => {
  if (!selectedDateStr.value) return [];
  return sessions.value.filter(s => s.fecha === selectedDateStr.value);
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem;">
          <CalendarIcon color="var(--accent-cyan)" :size="28" />
          <span>Calendario de Entrenamientos 📅 (Vue 3)</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Audita los días que has entrenado y consulta el desglose diario de cada sesión.
        </p>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem; background: rgba(15, 23, 42, 0.7); padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <button className="btn btn-secondary" style="padding: 0.4rem 0.6rem;" @click="handlePrevMonth">
          <ChevronLeft :size="20" />
        </button>
        <span style="font-size: 1.1rem; font-weight: 800; min-width: 150px; text-align: center;">
          {{ monthNames[month] }} {{ year }}
        </span>
        <button className="btn btn-secondary" style="padding: 0.4rem 0.6rem;" @click="handleNextMonth">
          <ChevronRight :size="20" />
        </button>
      </div>
    </div>

    <div className="grid-3" style="grid-template-columns: 2fr 1fr;">
      <!-- Grilla del Calendario -->
      <div className="glass-card" style="padding: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
          <div v-for="n in adjustedFirstDay" :key="`empty-${n}`" style="height: 75px; border-radius: 8px;" />

          <div
            v-for="dayNum in daysInMonth"
            :key="dayNum"
            @click="handleSelectDay(dayNum)"
            :style="{
              minHeight: '52px',
              padding: '0.3rem',
              borderRadius: '8px',
              background: selectedDateStr === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                ? 'rgba(0, 242, 254, 0.25)'
                : sessions.some(s => s.fecha === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`)
                ? 'rgba(127, 0, 255, 0.2)'
                : 'rgba(15, 23, 42, 0.5)',
              border: selectedDateStr === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                ? '2px solid var(--accent-cyan)'
                : sessions.some(s => s.fecha === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`)
                ? '1px solid rgba(127, 0, 255, 0.4)'
                : '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 800; font-size: 0.9rem;">{{ dayNum }}</span>
              <CheckCircle v-if="sessions.some(s => s.fecha === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`)" :size="14" color="var(--accent-cyan)" />
            </div>

            <template v-for="daySessions in [sessions.filter(s => s.fecha === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`)]">
              <div v-if="daySessions.length > 0" style="font-size: 0.68rem; background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); padding: 2px 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ daySessions[0].nombre_sesion }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Detalle Lateral -->
      <div className="glass-card" style="padding: 1.5rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          {{ selectedDateStr ? `Detalle: ${selectedDateStr}` : 'Selecciona un Día' }}
        </h3>

        <div v-if="!selectedDateStr" style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 2rem 0;">
          Haz clic en cualquier día del calendario para ver qué sesiones realizaste.
        </div>

        <div v-else-if="selectedDaySessions.length === 0" style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 2rem 0;">
          No se registraron entrenamientos el {{ selectedDateStr }}. Día de descanso/recuperación. 💤
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div v-for="ses in selectedDaySessions" :key="ses.id" style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-color);">
            <div style="font-weight: 800; font-size: 1rem; color: var(--accent-cyan); margin-bottom: 0.35rem;">
              {{ ses.nombre_sesion }}
            </div>

            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              <Clock :size="14" /> Duración: {{ ses.duracion_total_min }} min
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div v-for="(l, idx) in ses.logs" :key="idx" style="font-size: 0.85rem; background: rgba(255, 255, 255, 0.04); padding: 0.5rem 0.75rem; border-radius: 6px;">
                <strong>{{ l.ejercicio_nombre }}</strong>: {{ l.peso_kg ? `${l.peso_kg}kg x ${l.repeticiones} (1RM ~ ${l.rm_estimado}kg)` : l.ritmo_calculado || `${l.distancia}km` }}
              </div>
            </div>

            <div v-if="ses.notas" style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-top: 0.75rem;">
              "{{ ses.notas }}"
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

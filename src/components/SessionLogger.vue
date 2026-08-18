<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Plus, Trash2, Save, Calendar as CalendarIcon, Clock, CheckCircle2, Edit3, XCircle } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { getExercises, saveWorkoutSession, updateWorkoutSession, calculate1RM, formatPace, parseTimeToSeconds } from '../services/fitnessService';
import { Exercise, ExerciseLog, WorkoutSession } from '../types/fitness';

const props = defineProps<{
  sessionToEdit?: WorkoutSession | null;
}>();

const emit = defineEmits<{
  (e: 'sessionLogged'): void;
  (e: 'cancelEdit'): void;
}>();

const { user } = useAuth();
const exercises = ref<Exercise[]>([]);

const fecha = ref(new Date().toISOString().split('T')[0]);
const nombreSesion = ref('');
const duracionTotalMin = ref(60);
const notas = ref('');

interface LogLine {
  ejercicio_id: string;
  peso_kg: number;
  repeticiones: number;
  distancia: number;
  horas: number;
  minutos: number;
  segundos: number;
  desnivel_positivo: number;
  notas: string;
}

const logs = ref<LogLine[]>([]);
const saving = ref(false);
const successMsg = ref(false);

const fillFromSession = (session?: WorkoutSession | null) => {
  if (session) {
    fecha.value = session.fecha;
    nombreSesion.value = session.nombre_sesion;
    duracionTotalMin.value = session.duracion_total_min || 60;
    notas.value = session.notas || '';

    if (session.logs && session.logs.length > 0) {
      logs.value = session.logs.map(l => {
        const totalSecs = l.tiempo_segundos || 0;
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        return {
          ejercicio_id: l.ejercicio_id,
          peso_kg: l.peso_kg || 0,
          repeticiones: l.repeticiones || 0,
          distancia: l.distancia || 0,
          horas: hrs,
          minutos: mins,
          segundos: secs,
          desnivel_positivo: l.desnivel_positivo || 0,
          notas: l.notas || ''
        };
      });
    }
  } else {
    fecha.value = new Date().toISOString().split('T')[0];
    nombreSesion.value = '';
    duracionTotalMin.value = 60;
    notas.value = '';
    logs.value = [];
  }
};

onMounted(async () => {
  exercises.value = await getExercises(user.value?.id);
  fillFromSession(props.sessionToEdit);
});

watch(() => props.sessionToEdit, (newSession) => {
  fillFromSession(newSession);
});

const addExerciseLogLine = () => {
  if (exercises.value.length === 0) return;
  logs.value.push({
    ejercicio_id: exercises.value[0].id,
    peso_kg: 70,
    repeticiones: 10,
    distancia: 5,
    horas: 0,
    minutos: 25,
    segundos: 0,
    desnivel_positivo: 0,
    notas: ''
  });
};

const removeLogLine = (index: number) => {
  logs.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (!nombreSesion.value.trim()) {
    alert('Introduce un nombre para la sesión de entrenamiento.');
    return;
  }
  if (logs.value.length === 0) {
    alert('Añade al menos un ejercicio a la sesión.');
    return;
  }

  saving.value = true;

  const preparedLogs: Omit<ExerciseLog, 'id' | 'sesion_id'>[] = logs.value.map(l => {
    const ex = exercises.value.find(e => e.id === l.ejercicio_id);
    const isFuerza = ex?.tipo_metrica === 'peso_reps';
    const isTiempoPeso = ex?.tipo_metrica === 'tiempo_peso';
    const isCardio = ex?.tipo_metrica === 'tiempo_distancia' || ex?.tipo_metrica === 'tiempo_desnivel' || ex?.tipo_metrica === 'solo_tiempo';

    const totalSegundos = (isCardio || isTiempoPeso) ? parseTimeToSeconds(l.horas, l.minutos, l.segundos) : undefined;
    const rmEstimado = isFuerza ? calculate1RM(l.peso_kg, l.repeticiones) : undefined;
    const ritmoCalculado = isCardio && ex ? formatPace(totalSegundos || 0, l.distancia, ex.categoria, ex.unidad_distancia) : undefined;

    return {
      ejercicio_id: l.ejercicio_id,
      ejercicio_nombre: ex?.nombre,
      categoria: ex?.categoria,
      peso_kg: (isFuerza || isTiempoPeso) ? Number(l.peso_kg) : undefined,
      repeticiones: isFuerza ? Number(l.repeticiones) : undefined,
      rm_estimado: rmEstimado,
      distancia: isCardio ? Number(l.distancia) : undefined,
      tiempo_segundos: totalSegundos,
      desnivel_positivo: ex?.tipo_metrica === 'tiempo_desnivel' ? Number(l.desnivel_positivo) : undefined,
      ritmo_calculado: ritmoCalculado,
      notas: l.notas
    };
  });

  const sessionPayload = {
    fecha: fecha.value,
    nombre_sesion: nombreSesion.value,
    duracion_total_min: Number(duracionTotalMin.value),
    notas: notas.value
  };

  if (props.sessionToEdit) {
    await updateWorkoutSession(props.sessionToEdit.id, sessionPayload, preparedLogs, user.value?.id);
  } else {
    await saveWorkoutSession(sessionPayload, preparedLogs, user.value?.id);
  }

  saving.value = false;
  successMsg.value = true;
  setTimeout(() => {
    successMsg.value = false;
    emit('sessionLogged');
  }, 1000);
};
</script>

<template>
  <div className="glass-card" style="padding: 2rem;">
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
          <Edit3 v-if="props.sessionToEdit" color="var(--accent-orange)" />
          <span>{{ props.sessionToEdit ? 'Editar Sesión de Entrenamiento ✏️' : 'Registrar Nueva Sesión de Entrenamiento 📝' }}</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          {{ props.sessionToEdit ? 'Modifica los ejercicios, series o marcas de esta sesión.' : 'Guarda tus pesos/RMs o tus marcas de tiempo en carrera, bici, natación y esquí.' }}
        </p>
      </div>

      <button v-if="props.sessionToEdit" type="button" className="btn btn-secondary" @click="emit('cancelEdit')" style="padding: 0.5rem 1rem;">
        <XCircle :size="18" />
        <span>Cancelar Edición</span>
      </button>
    </div>

    <div v-if="successMsg" style="padding: 1rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; color: #34d399; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
      <CheckCircle2 :size="22" />
      <span>{{ props.sessionToEdit ? '¡Sesión actualizada correctamente!' : '¡Sesión guardada con éxito!' }}</span>
    </div>

    <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Cabecera de la Sesión -->
      <div className="grid-3">
        <div className="form-group">
          <label style="display: flex; align-items: center; gap: 0.4rem;">
            <CalendarIcon :size="16" /> Fecha del Entrenamiento
          </label>
          <input
            type="date"
            className="form-control"
            v-model="fecha"
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre de la Sesión / Bloque</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: Fuerza Pecho-Triceps o Rodaje 10K"
            v-model="nombreSesion"
            required
          />
        </div>

        <div className="form-group">
          <label style="display: flex; align-items: center; gap: 0.4rem;">
            <Clock :size="16" /> Duración Aproximada (minutos)
          </label>
          <input
            type="number"
            className="form-control"
            min="1"
            max="600"
            v-model.number="duracionTotalMin"
          />
        </div>
      </div>

      <!-- Ejercicios Añadidos -->
      <div style="margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Ejercicios Realizados</h3>
          <button type="button" className="btn btn-secondary" @click="addExerciseLogLine" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
            <Plus :size="16" />
            <span>Añadir Ejercicio</span>
          </button>
        </div>

        <div v-if="logs.length === 0" style="padding: 2rem; border: 2px dashed var(--border-color); border-radius: 12px; text-align: center; color: var(--text-muted);">
          Haz clic en "Añadir Ejercicio" para ingresar tus series o marcas de la sesión.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 1rem;">
          <div
            v-for="(log, idx) in logs"
            :key="idx"
            style="padding: 1.25rem; background: rgba(15, 23, 42, 0.75); border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 240px;">
                <select className="form-control" style="font-weight: 700;" v-model="log.ejercicio_id">
                  <option v-for="ex in exercises" :key="ex.id" :value="ex.id">
                    {{ ex.nombre }} ({{ ex.categoria.toUpperCase() }})
                  </option>
                </select>
              </div>

              <button type="button" className="btn btn-danger" style="padding: 0.4rem 0.75rem;" @click="removeLogLine(idx)">
                <Trash2 :size="16" />
              </button>
            </div>

            <!-- Inputs Reactivos según la categoría elegida -->
            <template v-for="ex in [exercises.find(e => e.id === log.ejercicio_id)]" :key="ex?.id">
              <!-- Fuerza / RM -->
              <div v-if="ex?.tipo_metrica === 'peso_reps'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; align-items: center;">
                <div className="form-group">
                  <label>Peso ({{ ex.unidad_peso || 'kg' }})</label>
                  <input type="number" step="0.5" className="form-control" v-model.number="log.peso_kg" />
                </div>
                <div className="form-group">
                  <label>Repeticiones</label>
                  <input type="number" className="form-control" v-model.number="log.repeticiones" />
                </div>
                <div style="padding: 0.5rem 0.9rem; background: rgba(255, 81, 47, 0.1); border: 1px solid rgba(255, 81, 47, 0.25); border-radius: 8px; text-align: center;">
                  <div style="font-size: 0.75rem; color: var(--text-muted);">1RM Estimado</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-orange);">
                    {{ calculate1RM(log.peso_kg, log.repeticiones) }} kg
                  </div>
                </div>
              </div>

              <!-- Tiempo + Peso -->
              <div v-else-if="ex?.tipo_metrica === 'tiempo_peso'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; align-items: center;">
                <div className="form-group">
                  <label>Peso ({{ ex.unidad_peso || 'kg' }})</label>
                  <input type="number" step="0.5" className="form-control" v-model.number="log.peso_kg" />
                </div>

                <div className="form-group">
                  <label>Tiempo Total (H : M : S)</label>
                  <div style="display: flex; gap: 0.25rem;">
                    <input type="number" min="0" className="form-control" placeholder="h" v-model.number="log.horas" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="m" v-model.number="log.minutos" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="s" v-model.number="log.segundos" />
                  </div>
                </div>
              </div>

              <!-- Cardio / Resistencia -->
              <div v-else style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; align-items: center;">
                <div className="form-group">
                  <label>Distancia ({{ ex?.unidad_distancia || 'km' }})</label>
                  <input type="number" step="0.01" className="form-control" v-model.number="log.distancia" />
                </div>

                <div className="form-group">
                  <label>Tiempo (H : M : S)</label>
                  <div style="display: flex; gap: 0.25rem;">
                    <input type="number" min="0" className="form-control" placeholder="h" v-model.number="log.horas" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="m" v-model.number="log.minutos" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="s" v-model.number="log.segundos" />
                  </div>
                </div>

                <div v-if="ex?.tipo_metrica === 'tiempo_desnivel'" className="form-group">
                  <label>Desnivel + (m)</label>
                  <input type="number" className="form-control" v-model.number="log.desnivel_positivo" />
                </div>

                <div style="padding: 0.5rem 0.9rem; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: 8px; text-align: center;">
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Ritmo / Velocidad</div>
                  <div style="font-size: 1rem; font-weight: 800; color: var(--accent-cyan);">
                    {{ ex ? formatPace(parseTimeToSeconds(log.horas, log.minutos, log.segundos), log.distancia, ex.categoria, ex.unidad_distancia) : '-' }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Notas -->
      <div className="form-group">
        <label>Notas / Sensaciones de la Sesión</label>
        <textarea
          className="form-control"
          rows="3"
          placeholder="Sensaciones de esfuerzo (RPE), clima o detalles del entreno..."
          v-model="notas"
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary" :disabled="saving" style="padding: 0.9rem; font-size: 1rem;">
        <Save :size="20" />
        <span>{{ saving ? 'Guardando...' : props.sessionToEdit ? 'Actualizar Sesión' : 'Guardar Sesión de Entrenamiento' }}</span>
      </button>
    </form>
  </div>
</template>

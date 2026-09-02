<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Plus, Trash2, Save, Calendar as CalendarIcon, Clock, CheckCircle2, Edit3, XCircle, Copy, ArrowUp, ArrowDown, Search, Sparkles, Dumbbell, Layers } from 'lucide-vue-next';
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

// Modal de Selección Masiva (Selector WOD)
const showMultiSelectModal = ref(false);
const multiSelectQuery = ref('');
const multiSelectCategory = ref<string>('todas');
const selectedExerciseIds = ref<string[]>([]);
const defaultBatchPeso = ref<number>(40);
const defaultBatchReps = ref<number>(15);

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

const duplicateLogLine = (index: number) => {
  const source = logs.value[index];
  logs.value.splice(index + 1, 0, {
    ...source,
    notas: source.notas ? `${source.notas} (Copia)` : ''
  });
};

const moveUpLogLine = (index: number) => {
  if (index <= 0) return;
  const temp = logs.value[index];
  logs.value[index] = logs.value[index - 1];
  logs.value[index - 1] = temp;
};

const moveDownLogLine = (index: number) => {
  if (index >= logs.value.length - 1) return;
  const temp = logs.value[index];
  logs.value[index] = logs.value[index + 1];
  logs.value[index + 1] = temp;
};

const removeLogLine = (index: number) => {
  logs.value.splice(index, 1);
};

// Modal Selección Masiva
const openMultiSelectModal = () => {
  multiSelectQuery.value = '';
  multiSelectCategory.value = 'todas';
  selectedExerciseIds.value = [];
  showMultiSelectModal.value = true;
};

const filteredExercises = computed(() => {
  return exercises.value.filter(ex => {
    const matchesCat = multiSelectCategory.value === 'todas' || ex.categoria === multiSelectCategory.value;
    const matchesQuery = !multiSelectQuery.value.trim() || ex.nombre.toLowerCase().includes(multiSelectQuery.value.toLowerCase());
    return matchesCat && matchesQuery;
  });
});

const toggleSelectExercise = (id: string) => {
  const idx = selectedExerciseIds.value.indexOf(id);
  if (idx === -1) {
    selectedExerciseIds.value.push(id);
  } else {
    selectedExerciseIds.value.splice(idx, 1);
  }
};

const confirmMultiSelect = () => {
  if (selectedExerciseIds.value.length === 0) {
    showMultiSelectModal.value = false;
    return;
  }

  selectedExerciseIds.value.forEach(id => {
    const ex = exercises.value.find(e => e.id === id);
    const isFuerzaWod = ex?.tipo_metrica === 'peso_reps' || ex?.categoria === 'crossfit' || ex?.categoria === 'fuerza' || ex?.categoria === 'hyrox';

    logs.value.push({
      ejercicio_id: id,
      peso_kg: isFuerzaWod ? Number(defaultBatchPeso.value) : 0,
      repeticiones: isFuerzaWod ? Number(defaultBatchReps.value) : 0,
      distancia: ex?.unidad_distancia === 'm' ? 400 : 1,
      horas: 0,
      minutos: 0,
      segundos: 0,
      desnivel_positivo: 0,
      notas: ''
    });
  });

  showMultiSelectModal.value = false;
};

// Plantillas Rápidas WOD
const loadWodTemplate = (templateType: 'fran' | 'murph' | 'hyrox') => {
  if (logs.value.length > 0 && !confirm('Esto añadirá los ejercicios de la plantilla al WOD actual. ¿Deseas continuar?')) {
    return;
  }

  if (templateType === 'fran') {
    if (!nombreSesion.value) nombreSesion.value = 'WOD Fran Benchmark (21-15-9)';
    const thruster = exercises.value.find(e => e.nombre.includes('Thruster')) || exercises.value[0];
    const pullups = exercises.value.find(e => e.nombre.includes('Dominadas') || e.nombre.includes('Pull-ups')) || exercises.value[0];

    [21, 15, 9].forEach(reps => {
      if (thruster) {
        logs.value.push({
          ejercicio_id: thruster.id,
          peso_kg: 43,
          repeticiones: reps,
          distancia: 0,
          horas: 0, minutos: 0, segundos: 0, desnivel_positivo: 0,
          notas: `Ronda de ${reps} reps`
        });
      }
      if (pullups) {
        logs.value.push({
          ejercicio_id: pullups.id,
          peso_kg: 0,
          repeticiones: reps,
          distancia: 0,
          horas: 0, minutos: 0, segundos: 0, desnivel_positivo: 0,
          notas: `Ronda de ${reps} reps`
        });
      }
    });
  } else if (templateType === 'murph') {
    if (!nombreSesion.value) nombreSesion.value = 'WOD Murph Hero WOD';
    const run = exercises.value.find(e => e.categoria === 'carrera') || exercises.value[0];
    const pullups = exercises.value.find(e => e.nombre.includes('Dominadas') || e.nombre.includes('Pull-ups')) || exercises.value[0];
    const pushups = exercises.value.find(e => e.nombre.includes('Flexiones') || e.nombre.includes('Push-ups')) || exercises.value[0];
    const squat = exercises.value.find(e => e.nombre.includes('Sentadilla')) || exercises.value[0];

    if (run) logs.value.push({ ejercicio_id: run.id, peso_kg: 0, repeticiones: 0, distancia: 1.6, horas: 0, minutos: 8, segundos: 30, desnivel_positivo: 0, notas: 'Carrera 1 Milla de inicio' });
    if (pullups) logs.value.push({ ejercicio_id: pullups.id, peso_kg: 0, repeticiones: 100, distancia: 0, horas: 0, minutos: 0, segundos: 0, desnivel_positivo: 0, notas: '100 Dominadas' });
    if (pushups) logs.value.push({ ejercicio_id: pushups.id, peso_kg: 0, repeticiones: 200, distancia: 0, horas: 0, minutos: 0, segundos: 0, desnivel_positivo: 0, notas: '200 Flexiones' });
    if (squat) logs.value.push({ ejercicio_id: squat.id, peso_kg: 0, repeticiones: 300, distancia: 0, horas: 0, minutos: 0, segundos: 0, desnivel_positivo: 0, notas: '300 Sentadillas' });
    if (run) logs.value.push({ ejercicio_id: run.id, peso_kg: 0, repeticiones: 0, distancia: 1.6, horas: 0, minutos: 9, segundos: 15, desnivel_positivo: 0, notas: 'Carrera 1 Milla final' });
  } else if (templateType === 'hyrox') {
    if (!nombreSesion.value) nombreSesion.value = 'Simulacro HYROX WOD';
    const sled = exercises.value.find(e => e.nombre.includes('Sled Push')) || exercises.value[0];
    const burpee = exercises.value.find(e => e.nombre.includes('Burpee')) || exercises.value[0];
    const wallball = exercises.value.find(e => e.nombre.includes('Wall Balls')) || exercises.value[0];

    if (sled) logs.value.push({ ejercicio_id: sled.id, peso_kg: 125, repeticiones: 1, distancia: 50, horas: 0, minutos: 2, segundos: 30, desnivel_positivo: 0, notas: 'Sled Push 50m' });
    if (burpee) logs.value.push({ ejercicio_id: burpee.id, peso_kg: 0, repeticiones: 80, distancia: 80, horas: 0, minutos: 3, segundos: 45, desnivel_positivo: 0, notas: 'Burpee Broad Jumps' });
    if (wallball) logs.value.push({ ejercicio_id: wallball.id, peso_kg: 9, repeticiones: 100, distancia: 0, horas: 0, minutos: 4, segundos: 10, desnivel_positivo: 0, notas: '100 Wall Balls 9kg' });
  }
};

const handleSubmit = async () => {
  if (!nombreSesion.value.trim()) {
    alert('Introduce un nombre para la sesión o WOD de entrenamiento.');
    return;
  }
  if (logs.value.length === 0) {
    alert('Añade al menos un ejercicio al WOD.');
    return;
  }

  saving.value = true;

  const preparedLogs: Omit<ExerciseLog, 'id' | 'sesion_id'>[] = logs.value.map(l => {
    const ex = exercises.value.find(e => e.id === l.ejercicio_id);
    const isFuerza = ex?.tipo_metrica === 'peso_reps' || ex?.categoria === 'crossfit' || ex?.categoria === 'fuerza';
    const isTiempoPeso = ex?.tipo_metrica === 'tiempo_peso';
    const isSoloTiempo = ex?.tipo_metrica === 'solo_tiempo';
    const isCardioConDistancia = ex?.tipo_metrica === 'tiempo_distancia' || ex?.tipo_metrica === 'tiempo_desnivel';

    const totalSegundos = (isCardioConDistancia || isTiempoPeso || isSoloTiempo || (l.horas || l.minutos || l.segundos)) ? parseTimeToSeconds(l.horas, l.minutos, l.segundos) : undefined;
    const rmEstimado = (l.peso_kg > 0 && l.repeticiones > 0) ? calculate1RM(l.peso_kg, l.repeticiones) : undefined;
    const ritmoCalculado = (isCardioConDistancia && ex) ? formatPace(totalSegundos || 0, l.distancia, ex.categoria, ex.unidad_distancia) : undefined;

    return {
      ejercicio_id: l.ejercicio_id,
      ejercicio_nombre: ex?.nombre,
      categoria: ex?.categoria,
      peso_kg: Number(l.peso_kg) > 0 ? Number(l.peso_kg) : (l.peso_kg === 0 ? 0 : undefined),
      repeticiones: Number(l.repeticiones) > 0 ? Number(l.repeticiones) : undefined,
      rm_estimado: rmEstimado,
      distancia: Number(l.distancia) > 0 ? Number(l.distancia) : undefined,
      tiempo_segundos: totalSegundos && totalSegundos > 0 ? totalSegundos : undefined,
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
    <!-- Encabezado de la Pantalla -->
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
          <Edit3 v-if="props.sessionToEdit" color="var(--accent-orange)" />
          <Dumbbell v-else color="var(--accent-cyan)" />
          <span>{{ props.sessionToEdit ? 'Editar Sesión de Entrenamiento / WOD ✏️' : 'Registrar Nuevo Entrenamiento o WOD 🏋️‍♂️' }}</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Registra WODs multiejercicio, series de fuerza con pesos y repeticiones, o sesiones de cardio.
        </p>
      </div>

      <button v-if="props.sessionToEdit" type="button" className="btn btn-secondary" @click="emit('cancelEdit')" style="padding: 0.5rem 1rem;">
        <XCircle :size="18" />
        <span>Cancelar Edición</span>
      </button>
    </div>

    <!-- Mensaje de Éxito -->
    <div v-if="successMsg" style="padding: 1rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; color: #34d399; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
      <CheckCircle2 :size="22" />
      <span>{{ props.sessionToEdit ? '¡Sesión / WOD actualizada correctamente!' : '¡WOD guardado con éxito!' }}</span>
    </div>

    <!-- Barra de Plantillas Rápidas WOD -->
    <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(127, 0, 255, 0.08); border: 1px solid rgba(127, 0, 255, 0.25); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--accent-purple);">
        <Sparkles :size="18" />
        <span>Plantillas Rápidas WOD:</span>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border-color: rgba(127, 0, 255, 0.3);" @click="loadWodTemplate('fran')">
          🔥 WOD Fran (21-15-9)
        </button>
        <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border-color: rgba(127, 0, 255, 0.3);" @click="loadWodTemplate('murph')">
          🛡️ WOD Murph Hero
        </button>
        <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border-color: rgba(127, 0, 255, 0.3);" @click="loadWodTemplate('hyrox')">
          ⚡ WOD HYROX Sim
        </button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Cabecera de la Sesión / WOD -->
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
          <label>Nombre de la Sesión / WOD</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: WOD Metcon 5 Rondas, Fuerza Banca + Dominadas o Rodaje 10K"
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

      <!-- Ejercicios Añadidos y Acciones de WOD -->
      <div style="margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800;">Ejercicios del WOD / Sesión</h3>
            <span v-if="logs.length > 0" className="badge badge-crossfit" style="font-size: 0.8rem;">
              {{ logs.length }} {{ logs.length === 1 ? 'ejercicio' : 'ejercicios' }}
            </span>
          </div>

          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <!-- Selector Masivo de Ejercicios -->
            <button type="button" className="btn btn-primary" @click="openMultiSelectModal" style="padding: 0.5rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #7f00ff, #e100ff);">
              <Layers :size="16" />
              <span>⚡ Añadir Varios Ejercicios (WOD)</span>
            </button>

            <!-- Añadir Ejercicio Individual -->
            <button type="button" className="btn btn-secondary" @click="addExerciseLogLine" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
              <Plus :size="16" />
              <span>Añadir 1 Ejercicio</span>
            </button>
          </div>
        </div>

        <!-- Estado vacio -->
        <div v-if="logs.length === 0" style="padding: 2.5rem 1.5rem; border: 2px dashed var(--border-color); border-radius: 12px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <Dumbbell :size="36" color="var(--accent-purple)" style="opacity: 0.6;" />
          <div>
            <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-bottom: 0.25rem;">
              Aún no has añadido ejercicios al WOD
            </div>
            <p style="font-size: 0.85rem; max-width: 450px; margin: 0 auto;">
              Usa el botón <strong>"⚡ Añadir Varios Ejercicios"</strong> para seleccionar múltiples movimientos de golpe con sus pesos y repeticiones.
            </p>
          </div>
        </div>

        <!-- Lista de Ejercicios del WOD -->
        <div v-else style="display: flex; flex-direction: column; gap: 1rem;">
          <div
            v-for="(log, idx) in logs"
            :key="idx"
            style="padding: 1.25rem; background: rgba(15, 23, 42, 0.75); border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem; position: relative;"
          >
            <!-- Cabecera de la Fila del Ejercicio -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 260px;">
                <span style="font-weight: 800; font-size: 0.85rem; padding: 0.25rem 0.55rem; background: rgba(255, 255, 255, 0.08); border-radius: 6px; color: var(--accent-cyan);">
                  #{{ idx + 1 }}
                </span>

                <select className="form-control" style="font-weight: 700; flex: 1;" v-model="log.ejercicio_id">
                  <option v-for="ex in exercises" :key="ex.id" :value="ex.id">
                    {{ ex.nombre }} ({{ ex.categoria.toUpperCase() }})
                  </option>
                </select>
              </div>

              <!-- Controles de Fila: Mover, Duplicar y Borrar -->
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.6rem;" title="Subir orden" :disabled="idx === 0" @click="moveUpLogLine(idx)">
                  <ArrowUp :size="14" />
                </button>
                <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.6rem;" title="Bajar orden" :disabled="idx === logs.length - 1" @click="moveDownLogLine(idx)">
                  <ArrowDown :size="14" />
                </button>
                <button type="button" className="btn btn-secondary" style="padding: 0.35rem 0.6rem; color: var(--accent-cyan);" title="Duplicar movimiento / ronda" @click="duplicateLogLine(idx)">
                  <Copy :size="14" />
                </button>
                <button type="button" className="btn btn-danger" style="padding: 0.35rem 0.6rem;" title="Eliminar del WOD" @click="removeLogLine(idx)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Campos de Pesos, Repeticiones, Tiempos y Distancias -->
            <template v-for="ex in [exercises.find(e => e.id === log.ejercicio_id)]" :key="ex?.id">
              <!-- Vista de Inputs Ajustables para WOD (Pesos + Repeticiones + Notas) -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; align-items: flex-end;">
                <!-- Peso (kg/lb) -->
                <div className="form-group">
                  <label style="font-weight: 700; color: var(--accent-orange);">Peso ({{ ex?.unidad_peso || 'kg' }})</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    v-model.number="log.peso_kg"
                  />
                </div>

                <!-- Repeticiones -->
                <div className="form-group">
                  <label style="font-weight: 700; color: var(--accent-cyan);">Repeticiones</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    v-model.number="log.repeticiones"
                  />
                </div>

                <!-- Tiempo (H : M : S) opcional si aplica -->
                <div className="form-group" style="grid-column: span 1;">
                  <label style="font-size: 0.8rem; color: var(--text-muted);">Tiempo (H : M : S)</label>
                  <div style="display: flex; gap: 0.2rem;">
                    <input type="number" min="0" className="form-control" placeholder="h" style="padding: 0.4rem 0.3rem; text-align: center;" v-model.number="log.horas" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="m" style="padding: 0.4rem 0.3rem; text-align: center;" v-model.number="log.minutos" />
                    <input type="number" min="0" max="59" className="form-control" placeholder="s" style="padding: 0.4rem 0.3rem; text-align: center;" v-model.number="log.segundos" />
                  </div>
                </div>

                <!-- Distancia (si es movimiento metabólico/cardio) -->
                <div v-if="ex?.tipo_metrica === 'tiempo_distancia' || ex?.tipo_metrica === 'tiempo_desnivel' || ex?.categoria === 'carrera' || ex?.categoria === 'ciclismo' || ex?.categoria === 'natacion'" className="form-group">
                  <label style="font-size: 0.8rem;">Distancia ({{ ex?.unidad_distancia || 'km' }})</label>
                  <input type="number" step="0.01" className="form-control" v-model.number="log.distancia" />
                </div>

                <!-- 1RM Calculado o Ritmo si corresponde -->
                <div v-if="log.peso_kg > 0 && log.repeticiones > 0" style="padding: 0.5rem 0.75rem; background: rgba(255, 81, 47, 0.1); border: 1px solid rgba(255, 81, 47, 0.25); border-radius: 8px; text-align: center;">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">1RM Estimado</div>
                  <div style="font-size: 1rem; font-weight: 800; color: var(--accent-orange);">
                    {{ calculate1RM(log.peso_kg, log.repeticiones) }} kg
                  </div>
                </div>
              </div>

              <!-- Observaciones / Notas específicas de la ronda o ejercicio -->
              <div className="form-group" style="margin-top: -0.25rem;">
                <input
                  type="text"
                  className="form-control"
                  style="font-size: 0.82rem; padding: 0.35rem 0.75rem; background: rgba(15, 23, 42, 0.5);"
                  placeholder="Detalles del movimiento en el WOD (ej: RX, Scaled, Unbroken, Mancuernas 22.5kg...)"
                  v-model="log.notas"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Notas Generales del WOD -->
      <div className="form-group">
        <label>Notas / Puntuación General del WOD (Time, Rondas + Reps, RPE)</label>
        <textarea
          className="form-control"
          rows="3"
          placeholder="Ej: WOD completado en 12:45 min (RX). Sensaciones excelentes en los Thrusters."
          v-model="notas"
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary" :disabled="saving" style="padding: 0.9rem; font-size: 1rem;">
        <Save :size="20" />
        <span>{{ saving ? 'Guardando...' : props.sessionToEdit ? 'Actualizar Sesión de WOD' : 'Guardar Entrenamiento de WOD' }}</span>
      </button>
    </form>

    <!-- Modal de Selección Masiva de Ejercicios para WOD -->
    <div v-if="showMultiSelectModal" className="modal-overlay">
      <div className="modal-content" style="max-width: 650px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            <Layers color="var(--accent-purple)" :size="24" />
            <span>Selección Masiva de Ejercicios WOD ⚡</span>
          </h2>
          <button type="button" className="btn btn-secondary" style="padding: 0.3rem 0.6rem;" @click="showMultiSelectModal = false">
            <XCircle :size="18" />
          </button>
        </div>

        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          Marca los ejercicios que componen tu WOD para añadirlos todos juntos a la sesión.
        </p>

        <!-- Filtros y Buscador en Modal -->
        <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div style="position: relative; flex: 1;">
              <Search :size="16" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);" />
              <input
                type="text"
                className="form-control"
                style="padding-left: 2.2rem; font-size: 0.9rem;"
                placeholder="Buscar ejercicio por nombre (ej: Thruster, Dominadas, Burpees)..."
                v-model="multiSelectQuery"
              />
            </div>
          </div>

          <!-- Selector de Categoría -->
          <div style="display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.4rem;">
            <button
              v-for="cat in ['todas', 'crossfit', 'hyrox', 'fuerza', 'carrera', 'ciclismo']"
              :key="cat"
              type="button"
              :class="['btn', multiSelectCategory === cat ? 'btn-primary' : 'btn-secondary']"
              style="padding: 0.25rem 0.65rem; font-size: 0.78rem; text-transform: uppercase;"
              @click="multiSelectCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Valores Predeterminados Rápidos para el lote -->
          <div style="padding: 0.75rem; background: rgba(255, 255, 255, 0.04); border-radius: 8px; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Valores iniciales para el lote:</span>
            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem;">
              <label>Peso (kg):</label>
              <input type="number" className="form-control" style="width: 70px; padding: 0.2rem 0.4rem;" v-model.number="defaultBatchPeso" />
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem;">
              <label>Reps:</label>
              <input type="number" className="form-control" style="width: 70px; padding: 0.2rem 0.4rem;" v-model.number="defaultBatchReps" />
            </div>
          </div>
        </div>

        <!-- Lista Seleccionable de Ejercicios -->
        <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.25rem; padding-right: 0.25rem;">
          <div
            v-for="ex in filteredExercises"
            :key="ex.id"
            @click="toggleSelectExercise(ex.id)"
            :style="{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: selectedExerciseIds.includes(ex.id) ? '1px solid var(--accent-purple)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: selectedExerciseIds.includes(ex.id) ? 'rgba(127, 0, 255, 0.2)' : 'rgba(15, 23, 42, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }"
          >
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <input
                type="checkbox"
                :checked="selectedExerciseIds.includes(ex.id)"
                @click.stop="toggleSelectExercise(ex.id)"
                style="width: 18px; height: 18px; cursor: pointer; accent-color: #7f00ff;"
              />
              <div>
                <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-main);">
                  {{ ex.nombre }}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  {{ ex.descripcion || `Categoría: ${ex.categoria}` }}
                </div>
              </div>
            </div>

            <span :class="['badge', `badge-${ex.categoria}`]" style="margin-left: auto; font-size: 0.72rem;">
              {{ ex.categoria }}
            </span>
          </div>

          <div v-if="filteredExercises.length === 0" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            No se encontraron ejercicios con el filtro seleccionado.
          </div>
        </div>

        <!-- Acciones del Modal -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan);">
            {{ selectedExerciseIds.length }} {{ selectedExerciseIds.length === 1 ? 'ejercicio seleccionado' : 'ejercicios seleccionados' }}
          </span>

          <div style="display: flex; gap: 0.75rem;">
            <button type="button" className="btn btn-secondary" @click="showMultiSelectModal = false">
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" :disabled="selectedExerciseIds.length === 0" @click="confirmMultiSelect" style="background: linear-gradient(135deg, #7f00ff, #e100ff);">
              <span>Añadir a la Sesión ({{ selectedExerciseIds.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

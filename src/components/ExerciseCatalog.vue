<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Dumbbell, Activity, Bike, Waves, Snowflake, Trophy, Flame, Pencil, Trash2 } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { getExercises, createExercise, updateExercise, deleteExercise } from '../services/fitnessService';
import { Exercise, ActivityCategory, MetricType } from '../types/fitness';

const { user } = useAuth();
const exercises = ref<Exercise[]>([]);
const showModal = ref(false);
const showDeleteConfirmModal = ref(false);
const loading = ref(true);

const editingExerciseId = ref<string | null>(null);
const exerciseToDelete = ref<Exercise | null>(null);

const nombre = ref('');
const categoria = ref<ActivityCategory>('fuerza');
const tipoMetrica = ref<MetricType>('peso_reps');
const unidadDistancia = ref<'km' | 'm'>('km');
const unidadPeso = ref<'kg' | 'lb'>('kg');
const descripcion = ref('');
const saving = ref(false);
const deleting = ref(false);

const loadEx = async () => {
  loading.value = true;
  exercises.value = await getExercises(user.value?.id);
  loading.value = false;
};

onMounted(loadEx);

const openCreateModal = () => {
  editingExerciseId.value = null;
  nombre.value = '';
  categoria.value = 'fuerza';
  tipoMetrica.value = 'peso_reps';
  unidadDistancia.value = 'km';
  unidadPeso.value = 'kg';
  descripcion.value = '';
  showModal.value = true;
};

const openEditModal = (ex: Exercise) => {
  editingExerciseId.value = ex.id;
  nombre.value = ex.nombre;
  categoria.value = ex.categoria;
  tipoMetrica.value = ex.tipo_metrica;
  unidadDistancia.value = ex.unidad_distancia || 'km';
  unidadPeso.value = ex.unidad_peso || 'kg';
  descripcion.value = ex.descripcion || '';
  showModal.value = true;
};

const handleSave = async () => {
  if (!nombre.value.trim()) return;

  saving.value = true;
  const payload = {
    nombre: nombre.value,
    categoria: categoria.value,
    tipo_metrica: tipoMetrica.value,
    unidad_distancia: unidadDistancia.value,
    unidad_peso: unidadPeso.value,
    descripcion: descripcion.value
  };

  if (editingExerciseId.value) {
    // Editar ejercicio existente
    const updated = await updateExercise(editingExerciseId.value, payload, user.value?.id);
    const index = exercises.value.findIndex(e => e.id === editingExerciseId.value);
    if (index !== -1) {
      exercises.value[index] = updated;
    }
  } else {
    // Crear nuevo ejercicio
    const newEx = await createExercise(payload, user.value?.id);
    exercises.value.push(newEx);
  }

  saving.value = false;
  showModal.value = false;
};

const confirmDelete = (ex: Exercise) => {
  exerciseToDelete.value = ex;
  showDeleteConfirmModal.value = true;
};

const handleDelete = async () => {
  if (!exerciseToDelete.value) return;

  deleting.value = true;
  const success = await deleteExercise(exerciseToDelete.value.id, user.value?.id);
  if (success) {
    exercises.value = exercises.value.filter(e => e.id !== exerciseToDelete.value?.id);
  }
  deleting.value = false;
  showDeleteConfirmModal.value = false;
  exerciseToDelete.value = null;
};
</script>

<template>
  <div v-if="loading" style="padding: 3rem; text-align: center; color: var(--text-muted);">
    Cargando catálogo de ejercicios...
  </div>

  <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 800;">Catálogo de Ejercicios & Métricas 🏋️‍♂️</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Crea, edita y organiza tus ejercicios personalizados para fuerza (RMs) y deportes de resistencia.
        </p>
      </div>

      <button className="btn btn-primary" @click="openCreateModal">
        <Plus :size="20" />
        <span>Crear Nuevo Ejercicio</span>
      </button>
    </div>

    <!-- Grid de Ejercicios -->
    <div className="grid-3">
      <div
        v-for="ex in exercises"
        :key="ex.id"
        className="glass-card glass-card-interactive"
        style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
              <Dumbbell v-if="ex.categoria === 'fuerza'" :size="20" color="#ff6b4a" />
              <Activity v-else-if="ex.categoria === 'carrera'" :size="20" color="#00f2fe" />
              <Bike v-else-if="ex.categoria === 'ciclismo'" :size="20" color="#10b981" />
              <Waves v-else-if="ex.categoria === 'natacion'" :size="20" color="#4facfe" />
              <Snowflake v-else-if="ex.categoria === 'esqui'" :size="20" color="#ec4899" />
              <Flame v-else-if="ex.categoria === 'hyrox'" :size="20" color="#f59e0b" />
              <Trophy v-else-if="ex.categoria === 'crossfit'" :size="20" color="#ef4444" />
              <Trophy v-else :size="20" color="#94a3b8" />
            </div>
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800;">{{ ex.nombre }}</h3>
              <span :class="['badge', `badge-${ex.categoria}`]" style="margin-top: 0.2rem;">
                {{ ex.categoria }}
              </span>
            </div>
          </div>

          <!-- Acciones de Edición y Borrado -->
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button
              type="button"
              title="Editar ejercicio"
              style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 0.45rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
              @click="openEditModal(ex)"
            >
              <Pencil :size="15" />
            </button>
            <button
              type="button"
              title="Eliminar ejercicio"
              style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 0.45rem; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
              @click="confirmDelete(ex)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <div style="font-size: 0.82rem; color: var(--text-muted); background: rgba(15, 23, 42, 0.5); padding: 0.65rem 0.85rem; border-radius: 8px;">
          <strong>Métrica:</strong>
          <span v-if="ex.tipo_metrica === 'peso_reps'"> Peso ({{ ex.unidad_peso || 'kg' }}) + Reps -> 1RM</span>
          <span v-else-if="ex.tipo_metrica === 'tiempo_distancia'"> Tiempo + Distancia ({{ ex.unidad_distancia || 'km' }}) -> Ritmo</span>
          <span v-else-if="ex.tipo_metrica === 'tiempo_desnivel'"> Tiempo + Distancia + Desnivel +m</span>
          <span v-else-if="ex.tipo_metrica === 'tiempo_peso'"> Tiempo + Peso ({{ ex.unidad_peso || 'kg' }})</span>
          <span v-else> Tiempo acumulado</span>
        </div>

        <p v-if="ex.descripcion" style="font-size: 0.82rem; color: var(--text-dim); font-style: italic;">
          {{ ex.descripcion }}
        </p>
      </div>
    </div>

    <!-- Modal para Crear / Editar Ejercicio -->
    <div v-if="showModal" className="modal-overlay">
      <div className="modal-content">
        <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 1.25rem;">
          {{ editingExerciseId ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio Personalizado' }}
        </h2>

        <form @submit.prevent="handleSave" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div className="form-group">
            <label>Nombre del Ejercicio</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ej: Dominadas lastradas, Series 400m, Rodaje Trail"
              v-model="nombre"
            />
          </div>

          <div className="form-group">
            <label>Disciplina / Categoría</label>
            <select className="form-control" v-model="categoria">
              <option value="fuerza">Fuerza / Musculación</option>
              <option value="carrera">Carrera a pie / Running</option>
              <option value="ciclismo">Ciclismo (Ruta / MTB / Rodillo)</option>
              <option value="natacion">Natación (Piscina / Aguas abiertas)</option>
              <option value="esqui">Esquí (Travesía / Fondo / Alpino)</option>
              <option value="hyrox">HYROX Fitness Racing</option>
              <option value="crossfit">CrossFit / Functional Fitness</option>
              <option value="otro">Otro deporte</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Métrica a Registrar</label>
            <select className="form-control" v-model="tipoMetrica">
              <option value="peso_reps">Peso + Repeticiones (Calcula 1RM)</option>
              <option value="tiempo_distancia">Tiempo + Distancia (Calcula Ritmo/Velocidad)</option>
              <option value="tiempo_desnivel">Tiempo + Distancia + Desnivel positivo (+m)</option>
              <option value="solo_tiempo">Únicamente Tiempo</option>
              <option value="tiempo_peso">Tiempo + Peso</option>
            </select>
          </div>

          <div v-if="tipoMetrica === 'peso_reps' || tipoMetrica === 'tiempo_peso'" className="form-group">
            <label>Unidad de Peso Principal</label>
            <select className="form-control" v-model="unidadPeso">
              <option value="kg">Kilogramos (kg)</option>
              <option value="lb">Libras (lb)</option>
            </select>
          </div>

          <div v-if="tipoMetrica === 'tiempo_distancia' || tipoMetrica === 'tiempo_desnivel'" className="form-group">
            <label>Unidad de Distancia Principal</label>
            <select className="form-control" v-model="unidadDistancia">
              <option value="km">Kilómetros (km)</option>
              <option value="m">Metros (m)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripción / Observaciones (Opcional)</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Notas sobre la técnica, agarre o equipamiento..."
              v-model="descripcion"
            ></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="button" className="btn btn-secondary" @click="showModal = false">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingExerciseId ? 'Guardar Cambios' : 'Crear Ejercicio') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Borrado -->
    <div v-if="showDeleteConfirmModal" className="modal-overlay">
      <div className="modal-content" style="max-width: 420px;">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: #ef4444; display: flex; align-items: center; gap: 0.5rem;">
          <Trash2 :size="22" />
          <span>Eliminar Ejercicio</span>
        </h2>

        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
          ¿Estás seguro de que deseas eliminar el ejercicio <strong>"{{ exerciseToDelete?.nombre }}"</strong>? Esta acción no se puede deshacer.
        </p>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" className="btn btn-secondary" @click="showDeleteConfirmModal = false" :disabled="deleting">
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" @click="handleDelete" :disabled="deleting" style="background: #ef4444; color: white;">
            {{ deleting ? 'Eliminando...' : 'Sí, Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Dumbbell, Activity, Bike, Waves, Snowflake, Trophy, Flame } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { getExercises, createExercise } from '../services/fitnessService';
import { Exercise, ActivityCategory, MetricType } from '../types/fitness';

const { user } = useAuth();
const exercises = ref<Exercise[]>([]);
const showCreateModal = ref(false);
const loading = ref(true);

const nombre = ref('');
const categoria = ref<ActivityCategory>('fuerza');
const tipoMetrica = ref<MetricType>('peso_reps');
const unidadDistancia = ref<'km' | 'm'>('km');
const unidadPeso = ref<'kg' | 'lb'>('kg');
const descripcion = ref('');
const creating = ref(false);

const loadEx = async () => {
  loading.value = true;
  exercises.value = await getExercises(user.value?.id);
  loading.value = false;
};

onMounted(loadEx);

const handleCreate = async () => {
  if (!nombre.value.trim()) return;

  creating.value = true;
  const newEx = await createExercise(
    {
      nombre: nombre.value,
      categoria: categoria.value,
      tipo_metrica: tipoMetrica.value,
      unidad_distancia: unidadDistancia.value,
      unidad_peso: unidadPeso.value,
      descripcion: descripcion.value
    },
    user.value?.id
  );

  exercises.value.push(newEx);
  creating.value = false;
  showCreateModal.value = false;
  nombre.value = '';
  descripcion.value = '';
};
</script>

<template>
  <div v-if="loading" style="padding: 3rem; text-align: center; color: var(--text-muted);">
    Cargando catálogo de ejercicios...
  </div>

  <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 800;">Catálogo de Ejercicios & Métricas 🏋️‍♂️ (Vue 3)</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Crea y organiza tus ejercicios personalizados para fuerza (RMs) y deportes de resistencia (carrera, bici, natación, esquí).
        </p>
      </div>

      <button className="btn btn-primary" @click="showCreateModal = true">
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

    <!-- Modal para Crear Ejercicio -->
    <div v-if="showCreateModal" className="modal-overlay">
      <div className="modal-content">
        <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 1.25rem;">
          Crear Nuevo Ejercicio Personalizado
        </h2>

        <form @submit.prevent="handleCreate" style="display: flex; flex-direction: column; gap: 1.25rem;">
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
            <button type="button" className="btn btn-secondary" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" :disabled="creating">
              {{ creating ? 'Guardando...' : 'Crear Ejercicio' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

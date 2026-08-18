<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { BarChart3, TrendingUp, Calendar } from 'lucide-vue-next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';
import { useAuth } from '../composables/useAuth';
import { getWorkoutSessions, getExercises } from '../services/fitnessService';
import { WorkoutSession, Exercise } from '../types/fitness';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { user } = useAuth();
const sessions = ref<WorkoutSession[]>([]);
const exercises = ref<Exercise[]>([]);
const selectedExerciseId = ref<string>('');
const loading = ref(true);

const loadData = async () => {
  loading.value = true;
  const [sesData, exData] = await Promise.all([
    getWorkoutSessions(user.value?.id),
    getExercises(user.value?.id)
  ]);
  sessions.value = sesData;
  exercises.value = exData;
  if (exData.length > 0) {
    selectedExerciseId.value = exData[0].id;
  }
  loading.value = false;
};

onMounted(loadData);
watch(user, loadData);

const selectedEx = computed(() => exercises.value.find(e => e.id === selectedExerciseId.value));

// Configuración de Chart.js para el gráfico de progresión
const lineChartData = computed(() => {
  const sortedSessions = sessions.value
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const labels: string[] = [];
  const weightData: number[] = [];
  const rmData: number[] = [];
  const distanceData: number[] = [];
  const timeData: number[] = [];

  sortedSessions.forEach(s => {
    const log = s.logs?.find(l => l.ejercicio_id === selectedExerciseId.value);
    if (log) {
      labels.push(s.fecha);
      weightData.push(log.peso_kg || 0);
      rmData.push(log.rm_estimado || 0);
      distanceData.push(log.distancia || 0);
      timeData.push(log.tiempo_segundos ? Math.round(log.tiempo_segundos / 60) : 0);
    }
  });

  const isFuerza = selectedEx.value?.tipo_metrica === 'peso_reps';
  const isTiempoPeso = selectedEx.value?.tipo_metrica === 'tiempo_peso';

  if (isFuerza) {
    return {
      labels,
      datasets: [
        {
          label: 'Peso Usado (kg)',
          borderColor: '#ff6b4a',
          backgroundColor: 'rgba(255, 107, 74, 0.2)',
          data: weightData,
          tension: 0.3
        },
        {
          label: '1RM Estimado (kg)',
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.2)',
          data: rmData,
          tension: 0.3
        }
      ]
    };
  }

  if (isTiempoPeso) {
    return {
      labels,
      datasets: [
        {
          label: 'Peso Usado (kg)',
          borderColor: '#ff6b4a',
          backgroundColor: 'rgba(255, 107, 74, 0.2)',
          data: weightData,
          tension: 0.3
        },
        {
          label: 'Tiempo Total (min)',
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.2)',
          data: timeData,
          tension: 0.3
        }
      ]
    };
  }

  return {
    labels,
    datasets: [
      {
        label: 'Distancia (km/m)',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        data: distanceData,
        tension: 0.3
      },
      {
        label: 'Tiempo (min)',
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.2)',
        data: timeData,
        tension: 0.3
      }
    ]
  };
});

// Configuración de Chart.js para la frecuencia mensual
const barChartData = computed(() => {
  const monthlyMap: Record<string, number> = {};
  sessions.value.forEach(s => {
    const monthKey = s.fecha.substring(0, 7);
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
  });

  const months = Object.keys(monthlyMap).sort();
  const counts = months.map(m => monthlyMap[m]);

  return {
    labels: months,
    datasets: [
      {
        label: 'Sesiones de Entrenamiento',
        backgroundColor: '#7f00ff',
        borderRadius: 8,
        data: counts
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#f8fafc' }
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255, 255, 255, 0.06)' }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255, 255, 255, 0.06)' }
    }
  }
};
</script>

<template>
  <div v-if="loading" style="padding: 3rem; text-align: center; color: var(--text-muted);">
    Cargando análisis y gráficos de rendimiento...
  </div>

  <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
    <div>
      <h2 style="font-size: 1.6rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem;">
        <BarChart3 color="var(--accent-cyan)" :size="28" />
        <span>Gráficos de Mejora & Continuidad 📈 (Vue 3 + Chart.js)</span>
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Visualiza tu progresión de fuerza (1RM / Peso) o resistencia (tiempos y ritmos) y analiza tu ritmo de entrenamiento.
      </p>
    </div>

    <!-- Gráfico 1: Evolución del Ejercicio Seleccionado -->
    <div className="glass-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
          <TrendingUp color="var(--accent-cyan)" />
          <span>Progresión Temporal de Ejercicio</span>
        </h3>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">Seleccionar Ejercicio:</span>
          <select className="form-control" style="font-weight: 700; min-width: 220px;" v-model="selectedExerciseId">
            <option v-for="ex in exercises" :key="ex.id" :value="ex.id">
              {{ ex.nombre }} ({{ ex.categoria.toUpperCase() }})
            </option>
          </select>
        </div>
      </div>

      <div v-if="lineChartData.labels.length === 0" style="padding: 3rem; text-align: center; color: var(--text-muted); background: rgba(15, 23, 42, 0.5); border-radius: 12px;">
        No hay registros de entrenamiento para el ejercicio <strong>"{{ selectedEx?.nombre }}"</strong> aún.
      </div>

      <div v-else style="width: 100%; height: 350px; margin-top: 1rem;">
        <Line :data="lineChartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Gráfico 2: Frecuencia Mensual -->
    <div className="glass-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
        <Calendar color="var(--accent-purple)" />
        <span>Frecuencia y Continuidad de Sesiones por Mes</span>
      </h3>

      <div v-if="barChartData.labels.length === 0" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        Registra tus primeras sesiones para visualizar el gráfico de frecuencia acumulada.
      </div>

      <div v-else style="width: 100%; height: 300px;">
        <Bar :data="barChartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

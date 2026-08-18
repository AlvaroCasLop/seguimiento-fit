<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { BarChart3, TrendingUp, Calendar, Zap, Activity } from 'lucide-vue-next';
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
const selectedMetricView = ref<string>('auto'); // 'auto', 'ritmo', 'distancia', 'tiempo', 'rm', 'peso', 'velocidad', 'desnivel'
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

// Opciones de vista de métrica disponibles según el tipo de ejercicio
const availableMetricOptions = computed(() => {
  if (!selectedEx.value) return [];
  const cat = selectedEx.value.categoria;
  const metricType = selectedEx.value.tipo_metrica;

  if (cat === 'carrera') {
    return [
      { id: 'ritmo', label: '⚡ Ritmo (min/km)' },
      { id: 'distancia', label: '📍 Distancia (km)' },
      { id: 'tiempo', label: '⏱️ Tiempo (min)' },
      { id: 'combinado', label: '📊 Distancia + Tiempo' }
    ];
  }

  if (cat === 'ciclismo') {
    return [
      { id: 'velocidad', label: '🚴 Velocidad Media (km/h)' },
      { id: 'distancia', label: '📍 Distancia (km)' },
      { id: 'tiempo', label: '⏱️ Tiempo (min)' }
    ];
  }

  if (cat === 'natacion') {
    return [
      { id: 'ritmo_100m', label: '🏊 Ritmo (min/100m)' },
      { id: 'distancia', label: '🏊‍♂️ Metros Nadados' },
      { id: 'tiempo', label: '⏱️ Tiempo (min)' }
    ];
  }

  if (metricType === 'peso_reps' || cat === 'fuerza') {
    return [
      { id: 'rm', label: '🏆 1RM Estimado (kg)' },
      { id: 'peso', label: '🏋️‍♂️ Peso Levantado (kg)' },
      { id: 'reps', label: '🔢 Repeticiones' }
    ];
  }

  if (metricType === 'tiempo_peso') {
    return [
      { id: 'peso', label: '🏋️‍♂️ Peso (kg)' },
      { id: 'tiempo', label: '⏱️ Tiempo (min)' },
      { id: 'combinado', label: '📊 Peso + Tiempo' }
    ];
  }

  if (metricType === 'tiempo_desnivel' || cat === 'esqui') {
    return [
      { id: 'desnivel', label: '🏔️ Desnivel Positivo (+m)' },
      { id: 'ritmo', label: '⚡ Ritmo (min/km)' },
      { id: 'tiempo', label: '⏱️ Tiempo (min)' }
    ];
  }

  return [
    { id: 'tiempo', label: '⏱️ Tiempo (min)' },
    { id: 'distancia', label: '📍 Distancia' }
  ];
});

// Reiniciar selector de métrica cuando cambia el ejercicio seleccionado
watch(selectedExerciseId, () => {
  const opts = availableMetricOptions.value;
  if (opts.length > 0) {
    selectedMetricView.value = opts[0].id;
  } else {
    selectedMetricView.value = 'auto';
  }
});

// Configuración de Chart.js para el gráfico de progresión reactivo
const lineChartData = computed(() => {
  const sortedSessions = sessions.value
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const labels: string[] = [];
  const paceValues: (number | null)[] = [];
  const paceLabels: string[] = [];
  const weightValues: number[] = [];
  const rmValues: number[] = [];
  const distanceValues: number[] = [];
  const timeValues: number[] = [];
  const speedValues: number[] = [];
  const desnivelValues: number[] = [];

  sortedSessions.forEach(s => {
    const log = s.logs?.find(l => l.ejercicio_id === selectedExerciseId.value);
    if (log) {
      labels.push(s.fecha);

      const totalSecs = log.tiempo_segundos || 0;
      const dist = log.distancia || 0;
      const unitDist = selectedEx.value?.unidad_distancia || 'km';
      const distKm = unitDist === 'm' ? dist / 1000 : dist;

      // Cálculo de Ritmo min/km
      if (totalSecs > 0 && distKm > 0) {
        const secsPerKm = totalSecs / distKm;
        const minsDecimal = Math.round((secsPerKm / 60) * 100) / 100;
        paceValues.push(minsDecimal);

        const m = Math.floor(secsPerKm / 60);
        const sec = Math.round(secsPerKm % 60);
        paceLabels.push(`${m}:${sec < 10 ? '0' : ''}${sec} min/km`);
      } else {
        paceValues.push(null);
        paceLabels.push('-');
      }

      // Velocidad media km/h
      if (totalSecs > 0 && distKm > 0) {
        const kmh = Math.round((distKm / (totalSecs / 3600)) * 10) / 10;
        speedValues.push(kmh);
      } else {
        speedValues.push(0);
      }

      weightValues.push(log.peso_kg || 0);
      rmValues.push(log.rm_estimado || 0);
      distanceValues.push(dist);
      timeValues.push(totalSecs ? Math.round((totalSecs / 60) * 10) / 10 : 0);
      desnivelValues.push(log.desnivel_positivo || 0);
    }
  });

  const activeView = selectedMetricView.value;

  if (activeView === 'ritmo') {
    return {
      labels,
      datasets: [
        {
          label: 'Ritmo (min/km) - Menor es más rápido',
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.2)',
          data: paceValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'velocidad') {
    return {
      labels,
      datasets: [
        {
          label: 'Velocidad Media (km/h)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          data: speedValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'ritmo_100m') {
    const pace100m = sortedSessions.map(s => {
      const log = s.logs?.find(l => l.ejercicio_id === selectedExerciseId.value);
      if (!log || !log.tiempo_segundos || !log.distancia) return null;
      const meters = selectedEx.value?.unidad_distancia === 'km' ? log.distancia * 1000 : log.distancia;
      const secsPer100m = (log.tiempo_segundos / meters) * 100;
      return Math.round((secsPer100m / 60) * 100) / 100;
    }).filter(v => v !== undefined);

    return {
      labels,
      datasets: [
        {
          label: 'Ritmo (min/100m)',
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.2)',
          data: pace100m,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'rm') {
    return {
      labels,
      datasets: [
        {
          label: '1RM Estimado (kg)',
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.2)',
          data: rmValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'peso') {
    return {
      labels,
      datasets: [
        {
          label: 'Peso Usado (kg)',
          borderColor: '#ff6b4a',
          backgroundColor: 'rgba(255, 107, 74, 0.2)',
          data: weightValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'distancia') {
    return {
      labels,
      datasets: [
        {
          label: `Distancia (${selectedEx.value?.unidad_distancia || 'km'})`,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          data: distanceValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'tiempo') {
    return {
      labels,
      datasets: [
        {
          label: 'Tiempo (minutos)',
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.2)',
          data: timeValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  if (activeView === 'desnivel') {
    return {
      labels,
      datasets: [
        {
          label: 'Desnivel Positivo (+m)',
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          data: desnivelValues,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  // Vista combinada por defecto (Distancia + Tiempo o Peso + 1RM)
  const isFuerza = selectedEx.value?.tipo_metrica === 'peso_reps';
  return {
    labels,
    datasets: isFuerza
      ? [
          {
            label: 'Peso Usado (kg)',
            borderColor: '#ff6b4a',
            backgroundColor: 'rgba(255, 107, 74, 0.2)',
            data: weightValues,
            tension: 0.3
          },
          {
            label: '1RM Estimado (kg)',
            borderColor: '#00f2fe',
            backgroundColor: 'rgba(0, 242, 254, 0.2)',
            data: rmValues,
            tension: 0.3
          }
        ]
      : [
          {
            label: `Distancia (${selectedEx.value?.unidad_distancia || 'km'})`,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            data: distanceValues,
            tension: 0.3
          },
          {
            label: 'Tiempo (min)',
            borderColor: '#4facfe',
            backgroundColor: 'rgba(79, 172, 254, 0.2)',
            data: timeValues,
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
      labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', weight: 'bold' } }
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) {
            const val = context.parsed.y;
            if (selectedMetricView.value === 'ritmo') {
              const mins = Math.floor(val);
              const secs = Math.round((val - mins) * 60);
              return `Ritmo: ${mins}:${secs < 10 ? '0' : ''}${secs} min/km`;
            }
            if (selectedMetricView.value === 'ritmo_100m') {
              const mins = Math.floor(val);
              const secs = Math.round((val - mins) * 60);
              return `Ritmo: ${mins}:${secs < 10 ? '0' : ''}${secs} min/100m`;
            }
            label += val;
          }
          return label;
        }
      }
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
        <span>Gráficos de Mejora & Ritmo 📈</span>
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Selecciona cualquier ejercicio y elige la métrica a visualizar: ritmo min/km en carrera, velocidad en bici, 1RM en fuerza o desnivel en esquí.
      </p>
    </div>

    <!-- Gráfico 1: Evolución del Ejercicio Seleccionado -->
    <div className="glass-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
          <TrendingUp color="var(--accent-cyan)" />
          <span>Progresión de Rendimiento</span>
        </h3>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Ejercicio:</span>
            <select className="form-control" style="font-weight: 700; min-width: 180px;" v-model="selectedExerciseId">
              <option v-for="ex in exercises" :key="ex.id" :value="ex.id">
                {{ ex.nombre }} ({{ ex.categoria.toUpperCase() }})
              </option>
            </select>
          </div>

          <div v-if="availableMetricOptions.length > 0" style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Métrica:</span>
            <select className="form-control" style="font-weight: 700; min-width: 170px;" v-model="selectedMetricView">
              <option v-for="opt in availableMetricOptions" :key="opt.id" :value="opt.id">
                {{ opt.label }}
              </option>
            </select>
          </div>
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

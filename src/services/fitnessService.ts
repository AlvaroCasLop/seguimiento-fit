import { getSupabaseClient } from '../lib/supabase';
import { Exercise, WorkoutSession, ExerciseLog, PersonalRecord, ActivityCategory } from '../types/fitness';

const LOCAL_STORAGE_EXERCISES = 'seguimiento_fit_local_exercises';
const LOCAL_STORAGE_SESSIONS = 'seguimiento_fit_local_sessions';

// Ejercicios semilla predeterminados para una primera experiencia inmediata
export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { nombre: 'Press de Banca', categoria: 'fuerza', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Fuerza de empuje horizontal (Pectoral, Tríceps)' },
  { nombre: 'Sentadilla Trasera', categoria: 'fuerza', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Fuerza de piernas (Cuádriceps, Glúteos)' },
  { nombre: 'Peso Muerto', categoria: 'fuerza', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Fuerza de tirón vertical (Cadena posterior)' },
  { nombre: 'Press Militar', categoria: 'fuerza', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Fuerza de empuje vertical (Hombro)' },
  { nombre: 'Carrera Continuada 10K', categoria: 'carrera', tipo_metrica: 'tiempo_distancia', unidad_distancia: 'km', descripcion: 'Rodaje de resistencia aeróbica' },
  { nombre: 'Series 1000m Carrera', categoria: 'carrera', tipo_metrica: 'tiempo_distancia', unidad_distancia: 'm', descripcion: 'Series de alta intensidad VO2 Max' },
  { nombre: 'Ruta Ciclismo Carretera', categoria: 'ciclismo', tipo_metrica: 'tiempo_distancia', unidad_distancia: 'km', descripcion: 'Salida de bici de ruta / fondo' },
  { nombre: 'Natación 1500m Crol', categoria: 'natacion', tipo_metrica: 'tiempo_distancia', unidad_distancia: 'm', descripcion: 'Sesión de piscina estilo libre' },
  { nombre: 'Esquí de Travesía / Montaña', categoria: 'esqui', tipo_metrica: 'tiempo_desnivel', unidad_distancia: 'km', descripcion: 'Ascenso con pieles y bajada de montaña' },
  // HYROX
  { nombre: 'Simulacro HYROX Completo', categoria: 'hyrox', tipo_metrica: 'solo_tiempo', descripcion: 'Carrera 8x1km + 8 estaciones de ejercicios HYROX' },
  { nombre: 'Sled Push 50m (HYROX)', categoria: 'hyrox', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Empuje de trineo pesado' },
  { nombre: 'Sled Pull 50m (HYROX)', categoria: 'hyrox', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Tirón de trineo con cuerda' },
  { nombre: 'Burpee Broad Jumps 80m (HYROX)', categoria: 'hyrox', tipo_metrica: 'solo_tiempo', descripcion: 'Burpees con salto horizontal largo' },
  { nombre: 'Wall Balls (HYROX)', categoria: 'hyrox', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Lanzamiento de balón medicinal a diana' },
  // CROSSFIT & WOD MOVEMENTS
  { nombre: 'WOD Fran (21-15-9)', categoria: 'crossfit', tipo_metrica: 'solo_tiempo', descripcion: 'Thrusters + Pull-ups por tiempo (Benchmark WOD)' },
  { nombre: 'WOD Murph', categoria: 'crossfit', tipo_metrica: 'solo_tiempo', descripcion: '1 Milla Run + 100 Pull-ups + 200 Push-ups + 300 Squats + 1 Milla Run' },
  { nombre: 'Thruster (CrossFit)', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Sentadilla frontal conectada con press militar' },
  { nombre: 'Clean & Jerk / Dos Tiempos', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Cargada y envión olímpico' },
  { nombre: 'Snatch / Arrancada', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Levantamiento olímpico en un movimiento' },
  { nombre: 'Dominadas / Pull-ups', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Tracción gimnástica en barra (con o sin lastre)' },
  { nombre: 'Flexiones / Push-ups', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Empuje de pecho en suelo' },
  { nombre: 'Kettlebell Swing', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Balanceo de pesa rusa' },
  { nombre: 'Toes to Bar (T2B)', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Pies a la barra' },
  { nombre: 'Box Jumps / Saltos al Cajón', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Salto pliométrico a cajón' },
  { nombre: 'Double Unders / Salto Doble', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Salto doble de comba' },
  { nombre: 'Dumbbell Devil Press', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Burpee + Snatch con mancuernas' },
  { nombre: 'Burpees', categoria: 'crossfit', tipo_metrica: 'peso_reps', unidad_peso: 'kg', descripcion: 'Flexión y salto vertical' }
];

// Cálculo de 1RM con fórmula de Epley: Peso * (1 + Reps / 30)
export function calculate1RM(weightKg: number, reps: number): number {
  if (!weightKg || weightKg <= 0) return 0;
  if (!reps || reps <= 0) return weightKg;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

// Cálculo de Ritmo de Cardio (ej. min/km o min/100m)
export function formatPace(tiempoSegundos: number, distancia: number, categoria: ActivityCategory, unidadDistancia: 'km' | 'm' = 'km'): string {
  if (!tiempoSegundos || !distancia || distancia <= 0) return '-';

  if (categoria === 'natacion') {
    // Ritmo por 100 metros
    const totalMetros = unidadDistancia === 'km' ? distancia * 1000 : distancia;
    const segundosPor100m = (tiempoSegundos / totalMetros) * 100;
    const mins = Math.floor(segundosPor100m / 60);
    const segs = Math.round(segundosPor100m % 60);
    return `${mins}:${segs < 10 ? '0' : ''}${segs} min/100m`;
  }

  if (categoria === 'ciclismo') {
    // Velocidad media en km/h
    const distanciaKm = unidadDistancia === 'm' ? distancia / 1000 : distancia;
    const horas = tiempoSegundos / 3600;
    const kmh = Math.round((distanciaKm / horas) * 10) / 10;
    return `${kmh} km/h`;
  }

  // Carrera / Ski: Ritmo min/km
  const distanciaKm = unidadDistancia === 'm' ? distancia / 1000 : distancia;
  const segundosPorKm = tiempoSegundos / distanciaKm;
  const mins = Math.floor(segundosPorKm / 60);
  const segs = Math.round(segundosPorKm % 60);
  return `${mins}:${segs < 10 ? '0' : ''}${segs} min/km`;
}

// Formatear segundos a HH:MM:SS
export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

// Convertir HH:MM:SS a segundos
export function parseTimeToSeconds(hours: number, minutes: number, seconds: number): number {
  return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
}

// --- SERVICIO DE EJERCICIOS ---

export async function getExercises(userId?: string): Promise<Exercise[]> {
  const supabase = getSupabaseClient();
  let userExercises: Exercise[] = [];

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data) {
      userExercises = data as Exercise[];
    }
  } else {
    // Fallback Local Storage
    const localData = localStorage.getItem(LOCAL_STORAGE_EXERCISES);
    if (localData) {
      try {
        userExercises = JSON.parse(localData);
      } catch {
        // ignore
      }
    }
  }

  // Generar lista de ejercicios por defecto del sistema
  const defaultList: Exercise[] = DEFAULT_EXERCISES.map((ex, idx) => ({
    ...ex,
    id: `default-ex-${idx + 1}`,
    user_id: 'system'
  }));

  // Filtrar para evitar duplicados si un usuario creó un ejercicio con el mismo nombre exacto
  const userExNames = new Set(userExercises.map(e => e.nombre.trim().toLowerCase()));
  const missingDefaults = defaultList.filter(d => !userExNames.has(d.nombre.trim().toLowerCase()));

  const combined = [...userExercises, ...missingDefaults];
  combined.sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Guardar en localStorage de respaldo si no hay nada guardado aún
  if (userExercises.length === 0 && !supabase) {
    localStorage.setItem(LOCAL_STORAGE_EXERCISES, JSON.stringify(combined));
  }

  return combined;
}

export async function createExercise(exercise: Omit<Exercise, 'id'>, userId?: string): Promise<Exercise> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { data, error } = await supabase
      .from('ejercicios')
      .insert([{ ...exercise, user_id: userId }])
      .select()
      .single();

    if (!error && data) {
      return data as Exercise;
    }
  }

  // Local Storage save
  const current = await getExercises(userId);
  const newEx: Exercise = {
    ...exercise,
    id: `local-ex-${Date.now()}`,
    user_id: userId || 'demo-user-id-fit-12345'
  };
  const updated = [...current, newEx];
  localStorage.setItem(LOCAL_STORAGE_EXERCISES, JSON.stringify(updated));
  return newEx;
}

export async function updateExercise(id: string, exerciseData: Partial<Exercise>, userId?: string): Promise<Exercise> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { data, error } = await supabase
      .from('ejercicios')
      .update(exerciseData)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as Exercise;
    }
  }

  // Local Storage save
  const current = await getExercises(userId);
  const updated = current.map(e => (e.id === id ? { ...e, ...exerciseData } : e));
  localStorage.setItem(LOCAL_STORAGE_EXERCISES, JSON.stringify(updated));

  const updatedEx = updated.find(e => e.id === id);
  return updatedEx || ({ id, ...exerciseData } as Exercise);
}

export async function deleteExercise(id: string, userId?: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { error } = await supabase
      .from('ejercicios')
      .delete()
      .eq('id', id);

    if (!error) {
      return true;
    }
  }

  // Local Storage save
  const current = await getExercises(userId);
  const filtered = current.filter(e => e.id !== id);
  localStorage.setItem(LOCAL_STORAGE_EXERCISES, JSON.stringify(filtered));
  return true;
}

// --- SERVICIO DE SESIONES DE ENTRENAMIENTO ---

export async function getWorkoutSessions(userId?: string): Promise<WorkoutSession[]> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { data: sessions, error: sesError } = await supabase
      .from('sesiones_entrenamiento')
      .select('*')
      .order('fecha', { ascending: false });

    if (!sesError && sessions) {
      const sessionIds = sessions.map(s => s.id);
      let logsMap: Record<string, ExerciseLog[]> = {};

      if (sessionIds.length > 0) {
        const { data: logs } = await supabase
          .from('registros_ejercicio')
          .select('*, ejercicios(nombre, categoria)')
          .in('sesion_id', sessionIds);

        if (logs) {
          logs.forEach((log: any) => {
            if (!logsMap[log.sesion_id]) logsMap[log.sesion_id] = [];
            logsMap[log.sesion_id].push({
              ...log,
              ejercicio_nombre: log.ejercicios?.nombre || 'Ejercicio',
              categoria: log.ejercicios?.categoria || 'otro'
            });
          });
        }
      }

      return sessions.map(s => ({
        ...s,
        logs: logsMap[s.id] || []
      }));
    }
  }

  // Fallback Local Storage
  const local = localStorage.getItem(LOCAL_STORAGE_SESSIONS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  // Sembrar algunas sesiones de ejemplo para la visualización del usuario
  const exercises = await getExercises(userId);
  const bench = exercises.find(e => e.nombre.includes('Press de Banca')) || exercises[0];
  const squat = exercises.find(e => e.nombre.includes('Sentadilla')) || exercises[1];
  const run = exercises.find(e => e.categoria === 'carrera') || exercises[4];

  const todayStr = new Date().toISOString().split('T')[0];
  const sampleSessions: WorkoutSession[] = [
    {
      id: 'local-session-1',
      user_id: userId || 'demo-user-id-fit-12345',
      fecha: todayStr,
      nombre_sesion: 'Fuerza Torso & Pecho',
      duracion_total_min: 70,
      notas: 'Sensaciones excelentes, nuevo RM en banca.',
      logs: [
        {
          id: 'log-1',
          sesion_id: 'local-session-1',
          ejercicio_id: bench.id,
          ejercicio_nombre: bench.nombre,
          categoria: bench.categoria,
          peso_kg: 100,
          repeticiones: 5,
          rm_estimado: calculate1RM(100, 5),
          notas: 'RPE 8.5'
        }
      ]
    },
    {
      id: 'local-session-2',
      user_id: userId || 'demo-user-id-fit-12345',
      fecha: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      nombre_sesion: 'Rodaje 10K Terreno Mixto',
      duracion_total_min: 50,
      notas: 'Ritmo sostenido y buenas sensaciones aeróbicas.',
      logs: [
        {
          id: 'log-2',
          sesion_id: 'local-session-2',
          ejercicio_id: run.id,
          ejercicio_nombre: run.nombre,
          categoria: run.categoria,
          distancia: 10,
          tiempo_segundos: 2940, // 49 min -> 4:54/km
          ritmo_calculado: formatPace(2940, 10, 'carrera', 'km'),
          notas: 'Ritmo medio 4:54 min/km'
        }
      ]
    },
    {
      id: 'local-session-3',
      user_id: userId || 'demo-user-id-fit-12345',
      fecha: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      nombre_sesion: 'Pierna & Fuerza Máxima',
      duracion_total_min: 65,
      notas: 'Sentadillas pesadas.',
      logs: [
        {
          id: 'log-3',
          sesion_id: 'local-session-3',
          ejercicio_id: squat.id,
          ejercicio_nombre: squat.nombre,
          categoria: squat.categoria,
          peso_kg: 140,
          repeticiones: 3,
          rm_estimado: calculate1RM(140, 3),
          notas: 'RPE 9'
        }
      ]
    }
  ];

  localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(sampleSessions));
  return sampleSessions;
}

export async function saveWorkoutSession(
  sessionData: Omit<WorkoutSession, 'id'>,
  logs: Omit<ExerciseLog, 'id' | 'sesion_id'>[],
  userId?: string
): Promise<WorkoutSession> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    // Insertar sesión
    const { data: newSession, error: sesErr } = await supabase
      .from('sesiones_entrenamiento')
      .insert([{
        user_id: userId,
        fecha: sessionData.fecha,
        nombre_sesion: sessionData.nombre_sesion,
        notas: sessionData.notas,
        duracion_total_min: sessionData.duracion_total_min
      }])
      .select()
      .single();

    if (!sesErr && newSession) {
      // Insertar logs
      const logsToInsert = logs.map(l => ({
        user_id: userId,
        sesion_id: newSession.id,
        ejercicio_id: l.ejercicio_id,
        peso_kg: l.peso_kg || null,
        repeticiones: l.repeticiones || null,
        rm_estimado: l.rm_estimado || null,
        distancia: l.distancia || null,
        tiempo_segundos: l.tiempo_segundos || null,
        desnivel_positivo: l.desnivel_positivo || null,
        ritmo_calculado: l.ritmo_calculado || null,
        notas: l.notas || null
      }));

      const { data: createdLogs } = await supabase
        .from('registros_ejercicio')
        .insert(logsToInsert)
        .select();

      return {
        ...newSession,
        logs: createdLogs || []
      };
    }
  }

  // Local Storage Save
  const currentSessions = await getWorkoutSessions(userId);
  const newSessionId = `local-session-${Date.now()}`;

  const createdLogs: ExerciseLog[] = logs.map((l, idx) => ({
    ...l,
    id: `log-${Date.now()}-${idx}`,
    sesion_id: newSessionId,
    user_id: userId || 'demo-user-id-fit-12345'
  }));

  const createdSession: WorkoutSession = {
    ...sessionData,
    id: newSessionId,
    user_id: userId || 'demo-user-id-fit-12345',
    logs: createdLogs
  };

  const updated = [createdSession, ...currentSessions];
  localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(updated));
  return createdSession;
}

export async function updateWorkoutSession(
  sessionId: string,
  sessionData: Omit<WorkoutSession, 'id'>,
  logs: Omit<ExerciseLog, 'id' | 'sesion_id'>[],
  userId?: string
): Promise<WorkoutSession> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    // Actualizar datos de la sesión
    await supabase
      .from('sesiones_entrenamiento')
      .update({
        fecha: sessionData.fecha,
        nombre_sesion: sessionData.nombre_sesion,
        notas: sessionData.notas,
        duracion_total_min: sessionData.duracion_total_min
      })
      .eq('id', sessionId);

    // Borrar logs anteriores e insertar los nuevos
    await supabase
      .from('registros_ejercicio')
      .delete()
      .eq('sesion_id', sessionId);

    const logsToInsert = logs.map(l => ({
      user_id: userId,
      sesion_id: sessionId,
      ejercicio_id: l.ejercicio_id,
      peso_kg: l.peso_kg || null,
      repeticiones: l.repeticiones || null,
      rm_estimado: l.rm_estimado || null,
      distancia: l.distancia || null,
      tiempo_segundos: l.tiempo_segundos || null,
      desnivel_positivo: l.desnivel_positivo || null,
      ritmo_calculado: l.ritmo_calculado || null,
      notas: l.notas || null
    }));

    const { data: createdLogs } = await supabase
      .from('registros_ejercicio')
      .insert(logsToInsert)
      .select();

    return {
      id: sessionId,
      ...sessionData,
      logs: createdLogs || []
    };
  }

  // Local Storage Update
  const currentSessions = await getWorkoutSessions(userId);
  const createdLogs: ExerciseLog[] = logs.map((l, idx) => ({
    ...l,
    id: `log-${Date.now()}-${idx}`,
    sesion_id: sessionId,
    user_id: userId || 'demo-user-id-fit-12345'
  }));

  const updatedSession: WorkoutSession = {
    ...sessionData,
    id: sessionId,
    user_id: userId || 'demo-user-id-fit-12345',
    logs: createdLogs
  };

  const updatedList = currentSessions.map(s => s.id === sessionId ? updatedSession : s);
  localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(updatedList));
  return updatedSession;
}

export async function deleteWorkoutSession(sessionId: string, userId?: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'demo-user-id-fit-12345') {
    const { error } = await supabase
      .from('sesiones_entrenamiento')
      .delete()
      .eq('id', sessionId);
    return !error;
  }

  // Local Storage Delete
  const currentSessions = await getWorkoutSessions(userId);
  const filtered = currentSessions.filter(s => s.id !== sessionId);
  localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(filtered));
  return true;
}

// --- CÁLCULO DE RECORDS PERSONALES (RMs y Mejores Marcas) ---

export async function getPersonalRecords(userId?: string): Promise<PersonalRecord[]> {
  const sessions = await getWorkoutSessions(userId);
  const exercises = await getExercises(userId);

  const recordsMap: Record<string, PersonalRecord> = {};

  sessions.forEach(session => {
    session.logs?.forEach(log => {
      const exercise = exercises.find(e => e.id === log.ejercicio_id);
      const exName = log.ejercicio_nombre || exercise?.nombre || 'Ejercicio';
      const cat = log.categoria || exercise?.categoria || 'otro';
      const metricType = exercise?.tipo_metrica || 'peso_reps';

      if (!recordsMap[log.ejercicio_id]) {
        recordsMap[log.ejercicio_id] = {
          ejercicio_id: log.ejercicio_id,
          ejercicio_nombre: exName,
          categoria: cat,
          tipo_metrica: metricType,
          fecha_logro: session.fecha
        };
      }

      const pr = recordsMap[log.ejercicio_id];

      // Verificar 1RM / Peso máximo
      if (log.peso_kg && (!pr.max_peso_kg || log.peso_kg > pr.max_peso_kg)) {
        pr.max_peso_kg = log.peso_kg;
        pr.fecha_logro = session.fecha;
      }
      if (log.rm_estimado && (!pr.max_rm_estimado || log.rm_estimado > pr.max_rm_estimado)) {
        pr.max_rm_estimado = log.rm_estimado;
      }

      // Verificar mejor tiempo / mejor distancia
      if (log.distancia && (!pr.mejor_distancia || log.distancia > pr.mejor_distancia)) {
        pr.mejor_distancia = log.distancia;
      }
      if (log.tiempo_segundos && (!pr.mejor_tiempo_segundos || log.tiempo_segundos < pr.mejor_tiempo_segundos)) {
        pr.mejor_tiempo_segundos = log.tiempo_segundos;
        pr.mejor_ritmo = log.ritmo_calculado;
        pr.fecha_logro = session.fecha;
      }
    });
  });

  return Object.values(recordsMap);
}

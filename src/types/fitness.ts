export type ActivityCategory = 'fuerza' | 'carrera' | 'ciclismo' | 'natacion' | 'esqui' | 'hyrox' | 'crossfit' | 'otro';

export type MetricType = 'peso_reps' | 'tiempo_distancia' | 'tiempo_desnivel' | 'solo_tiempo' | 'tiempo_peso';

export interface Exercise {
  id: string;
  user_id?: string;
  nombre: string;
  categoria: ActivityCategory;
  tipo_metrica: MetricType;
  unidad_distancia?: 'km' | 'm';
  unidad_peso?: 'kg' | 'lb';
  descripcion?: string;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  user_id?: string;
  fecha: string; // YYYY-MM-DD
  nombre_sesion: string;
  notas?: string;
  duracion_total_min?: number;
  created_at?: string;
  logs?: ExerciseLog[];
}

export interface ExerciseLog {
  id: string;
  user_id?: string;
  sesion_id: string;
  ejercicio_id: string;
  ejercicio_nombre?: string;
  categoria?: ActivityCategory;
  peso_kg?: number;
  repeticiones?: number;
  rm_estimado?: number; // 1RM en kg
  distancia?: number; // km o metros
  tiempo_segundos?: number; // segundos
  desnivel_positivo?: number; // metros
  ritmo_calculado?: string; // min/km, min/100m, etc.
  notas?: string;
  created_at?: string;
}

export interface PersonalRecord {
  ejercicio_id: string;
  ejercicio_nombre: string;
  categoria: ActivityCategory;
  tipo_metrica: MetricType;
  max_peso_kg?: number;
  max_rm_estimado?: number;
  mejor_tiempo_segundos?: number;
  mejor_distancia?: number;
  mejor_ritmo?: string;
  fecha_logro?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

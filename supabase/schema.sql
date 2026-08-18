-- ==========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS Y RLS PARA SEGUIMIENTO-FIT
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

-- 1. Tabla de Ejercicios
CREATE TABLE IF NOT EXISTS public.ejercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  nombre text NOT NULL,
  categoria text NOT NULL, -- 'fuerza', 'carrera', 'ciclismo', 'natacion', 'esqui', 'otro'
  tipo_metrica text NOT NULL, -- 'peso_reps', 'tiempo_distancia', 'tiempo_desnivel', 'solo_tiempo'
  unidad_distancia text DEFAULT 'km',
  unidad_peso text DEFAULT 'kg',
  descripcion text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Tabla de Sesiones de Entrenamiento (Días entrenados)
CREATE TABLE IF NOT EXISTS public.sesiones_entrenamiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  nombre_sesion text NOT NULL,
  notas text,
  duracion_total_min integer DEFAULT 60,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Tabla de Registros de Ejercicio (Marcas/Series por sesión)
CREATE TABLE IF NOT EXISTS public.registros_ejercicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  sesion_id uuid REFERENCES public.sesiones_entrenamiento(id) ON DELETE CASCADE NOT NULL,
  ejercicio_id uuid REFERENCES public.ejercicios(id) ON DELETE CASCADE NOT NULL,
  peso_kg numeric,
  repeticiones integer,
  rm_estimado numeric, -- 1RM calculado automáticamente
  distancia numeric,
  tiempo_segundos integer,
  desnivel_positivo numeric,
  ritmo_calculado text,
  notas text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ejercicio ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad (Políticas de aislamiento por usuario)

-- Políticas para Ejercicios
CREATE POLICY "Ejercicios: Los usuarios leen solo sus ejercicios" 
  ON public.ejercicios FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Ejercicios: Los usuarios insertan sus propios ejercicios" 
  ON public.ejercicios FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ejercicios: Los usuarios actualizan sus propios ejercicios" 
  ON public.ejercicios FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Ejercicios: Los usuarios eliminan sus propios ejercicios" 
  ON public.ejercicios FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Sesiones de Entrenamiento
CREATE POLICY "Sesiones: Los usuarios leen solo sus sesiones" 
  ON public.sesiones_entrenamiento FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sesiones: Los usuarios insertan sus propias sesiones" 
  ON public.sesiones_entrenamiento FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sesiones: Los usuarios actualizan sus propias sesiones" 
  ON public.sesiones_entrenamiento FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Sesiones: Los usuarios eliminan sus propias sesiones" 
  ON public.sesiones_entrenamiento FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Registros de Ejercicios
CREATE POLICY "Registros: Los usuarios leen solo sus registros" 
  ON public.registros_ejercicio FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Registros: Los usuarios insertan sus propios registros" 
  ON public.registros_ejercicio FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Registros: Los usuarios actualizan sus propios registros" 
  ON public.registros_ejercicio FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Registros: Los usuarios eliminan sus propios registros" 
  ON public.registros_ejercicio FOR DELETE USING (auth.uid() = user_id);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_ejercicios_user_id ON public.ejercicios(user_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_user_id_fecha ON public.sesiones_entrenamiento(user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_registros_sesion_id ON public.registros_ejercicio(sesion_id);
CREATE INDEX IF NOT EXISTS idx_registros_ejercicio_id ON public.registros_ejercicio(ejercicio_id);

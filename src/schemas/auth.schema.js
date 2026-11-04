import { z } from 'zod';

export const registerSchema = z.object({
    username: z
        .string({required_error: 'Usuario requerido'}),
    email: z
        .string({required_error: 'Email requerido'})
        .email({message: 'Email inválido'}),
    password: z
        .string({required_error: 'Contraseña requerida'})
});

export const loginSchema = z.object({
    username: z
      .string({required_error: 'Usuario requerido'}),
    password: z
        .string({required_error: 'Contraseña requerida'})
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres'}),
});

export const asignaturaSchema = z.object({
    nombre: z
      .string({ required_error: 'Nombre requerido' })
      .min(1, { message: 'El nombre no puede estar vacío' }),
      
    curso: z
      .number({ required_error: 'Curso requerido' })
      .min(1, { message: 'El curso debe ser mayor que 0' })
      .max(4, { message: 'El curso debe ser entre 1 y 4' }),
      
    creditos: z
      .number({ required_error: 'Créditos requeridos' })
      .min(1, { message: 'La asignatura debe valer al menos 1 crédito' }),
      
    dificultad: z.enum(['baja', 'media', 'moderada', 'alta', 'critica'], {
      required_error: 'Dificultad requerida',
      invalid_type_error: 'La dificultad debe ser una de las opciones válidas: baja, media, moderada, alta, critica',
    }),
  
    cuatrimestre: z.enum(['primero', 'segundo'], {
      required_error: 'Cuatrimestre requerido',
      invalid_type_error: 'El cuatrimestre debe ser "primero" o "segundo"',
    }),
  });

export const horarioSchema = z.object({
  nombre: z
    .string({ required_error: 'Nombre del horario requerido' })
    .min(1, { message: 'El nombre no puede estar vacío' }),

  asignaturas: z.array(z.string().uuid({ message: 'Las asignaturas deben ser identificadores válidos' })).nonempty({ message: 'Debe tener al menos una asignatura' }),

  user: z
  .string({ required_error: 'El ID de usuario es requerido' })
  .uuid({ message: 'El ID de usuario debe ser un identificador válido' }), 
});

  
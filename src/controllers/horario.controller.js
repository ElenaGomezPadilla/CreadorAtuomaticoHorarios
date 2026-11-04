import Horario from '../models/horario.models.js';
import User from '../models/user.models.js';
import Asignatura from '../models/asignatura.models.js';
import Itinerario from '../models/itinerario.models.js';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../libs/jwt.js';

/**
 * @file Controladores de gestión para el modelo Horario.
 * @description Maneja las lógicas de negocio asociadas a los horarios de usuarios registrados e invitados.
 */

/**
 * Obtiene un listado de todos los horarios filtrados por el usuario actual o el usuario maestro 'invitado'.
 * @async
 * @param {import('express').Request} req - Objeto de petición de Express. Puede contener `req.user` mediante middleware de autenticación opcional.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve la lista de horarios poblada y ordenada de manera descendente.
 */
export const getHorarios = async (req, res) => {
    try {
        let userId;

        if (req.user) {
            // Caso 1: Usuario registrado (usamos el ID extraído de su token)
            userId = req.user.id;
        } else {
            // Caso 2: Usuario invitado (buscamos el ID del usuario maestro con rol 'invitado')
            const invitado = await User.findOne({ role: 'invitado' });
            if (!invitado) return res.status(200).json([]); 
            userId = invitado._id;
        }
        
        const horarios = await Horario.find({ user: userId })
            .populate('user')
            .populate('asignaturas')
            .populate('itinerarios')
            .sort({ createdAt: -1 }); // El más reciente primero

        res.json(horarios);
    } catch (error) {
        console.error('Error en getHorarios:', error);
        res.status(500).json({ message: 'Error al obtener los horarios' });
    }
};

/**
 * Obtiene estrictamente los horarios pertenecientes al usuario autenticado de la petición.
 * @async
 * @param {import('express').Request} req - Requiere `req.user.id` del middleware de autenticación obligatoria.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getHorariosPorUsuario = async (req, res) => {
    try {
        const horarios = await Horario.find({ user: req.user.id })
            .populate('user', 'username email') // Trae solo campos seguros y esenciales de la cuenta
            .populate('asignaturas')
            .populate('itinerarios')
            .sort({ createdAt: -1 });

        res.json(horarios);
    } catch (error) {
        console.error('Error en getHorariosPorUsuario:', error);
        res.status(500).json({ message: 'Error al obtener los horarios' });
    }
};

/**
 * Obtiene un único horario a partir de su ID de base de datos.
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getHorario = async (req, res) => {
    try {
        const horario = await Horario.findById(req.params.id)
            .populate('asignaturas')
            .populate('itinerarios');

        if (!horario) {
            return res.status(404).json({ message: 'Horario no hallado' });
        }

        res.json(horario);
    } catch (error) {
        console.error('Error en getHorario:', error);
        res.status(500).json({ message: 'Error al buscar el horario' });
    }
};

/**
 * Actualiza los parámetros de un horario validando que las asignaturas inyectadas existan realmente en la BD.
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id` y las mutaciones en `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve el nuevo documento modificado.
 */
export const updateHorario = async (req, res) => {
    try {
        const { asignaturas } = req.body;

        // Si se actualizan asignaturas, se valida su existencia colectiva previa
        if (asignaturas && asignaturas.length > 0) {
            const foundAsignaturas = await Asignatura.find({ '_id': { $in: asignaturas } });
            
            if (foundAsignaturas.length !== asignaturas.length) {
                return res.status(400).json({ message: 'Una o más asignaturas no existen.' });
            }
        }

        const horario = await Horario.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        if (!horario) {
            return res.status(404).json({ message: 'Horario no hallado' });
        }

        res.json(horario);
    } catch (error) {
        console.error('Error en updateHorario:', error);
        res.status(500).json({ message: 'Error al actualizar el horario' });
    }
};

/**
 * Elimina un horario de manera segura verificando que pertenezca al usuario que solicita la baja.
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id`. Restringe la acción si no hay `req.user`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Retorna un estado 204 sin contenido tras una eliminación exitosa.
 */
export const deleteHorario = async (req, res) => {  
    try {  
        // Restricción de seguridad: Los invitados no poseen permisos de borrado permanente
        if (!req.user) {
            return res.status(403).json({ message: "Los invitados no pueden borrar datos del servidor" });
        }

        // Validación de propiedad integrada en la consulta para evitar vulnerabilidades de ID directo
        const horario = await Horario.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id 
        });

        if (!horario) {
            return res.status(404).json({ message: 'Horario no hallado o no está autorizado' });
        }    
        
        return res.sendStatus(204);
    } catch (error) {
        console.error('Error en deleteHorario:', error);
        return res.status(500).json({ message: "Error interno al eliminar un horario" });
    }
};

/**
 * Crea un nuevo registro de horario asignándole propiedad de usuario o rol de invitado según corresponda.
 * @async
 * @param {import('express').Request} req - Petición de Express. Requiere un array de asignaturas mínimo en el `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con el documento del nuevo horario guardado.
 */
export const createHorario = async (req, res) => {
    try {
        const { nombre, asignaturas, itinerarios } = req.body;

        if (!asignaturas || !Array.isArray(asignaturas) || asignaturas.length === 0) {
            return res.status(400).json({ message: "Debes enviar al menos una asignatura" });
        }

        if (!Array.isArray(itinerarios)) {
            return res.status(400).json({ message: "El campo itinerarios debe ser una lista válida (puede ir vacía)." });
        }

        let userId;

        if (req.user) { 
            userId = req.user.id; 
        } else {
            const invitado = await User.findOne({ role: 'invitado' });
            if (!invitado) {
                return res.status(500).json({ message: 'No hay usuario invitado disponible' });
            }
            userId = invitado._id;
        }

        const nuevoHorario = new Horario({
            nombre: nombre || 'Horario sin nombre',
            asignaturas,
            itinerarios,
            user: userId,
        });

        const horarioCreado = await Horario.create(nuevoHorario);
        res.status(201).json(horarioCreado);
    } catch (error) {
        console.error("Error en createHorario:", error);
        res.status(500).json({ message: 'Error al crear el horario' });
    }
};


/**
 * @file Controlador del motor de optimización de horarios universitarios.
 * @description Orquesta el proceso de backtracking multinivel (asignaturas y grupos) relajando restricciones dinámicamente si no hay soluciones directas.
 */

/**
 * Genera un set de horarios personalizados óptimos sin solapes a partir de las preferencias de entrada.
 * Evaluará sucesivamente la exclusión de asignaturas deseadas, turnos, cursos y prerrequisitos si el espacio es muy restrictivo.
 * @async
 * @param {import('express').Request} req - Petición de Express que contiene los vectores de filtrado y el objeto de preferencias en `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Envía un JSON con un array de propuestas de horarios, metadatos del grafo y alertas de restricciones relajadas.
 */
export const createHorariosPersonalizados = async (req, res) => {
  try {
    const { asignaturasCursadas, asignaturasExcluidas, asignaturasDeseadas, preferencias } = req.body;

    // Recuperación de la base de datos optimizada en memoria mediante consultas planas (.lean())
    const asignaturas = await Asignatura.find().lean();
    const itinerarios = await Itinerario.find().lean();

    // ==========================================
    // VALIDACIONES PREVIAS Y CONTROL DE LÍMITES
    // ==========================================
    if (!Array.isArray(asignaturas)) {
      return res.status(400).json({ message: "El campo asignaturas debe ser una lista válida." });
    }
    const totalAsignaturas = asignaturas.length;

    if (!Array.isArray(asignaturasCursadas) || asignaturasCursadas.length === totalAsignaturas) {
      return res.status(400).json({ message: "Ya ha cursado todas las asignaturas" });
    }
    if (!Array.isArray(asignaturasExcluidas) || asignaturasExcluidas.length === totalAsignaturas) {
      return res.status(400).json({ message: "No puede crearse un horario sin asignaturas" });
    }
    if (!Array.isArray(asignaturasDeseadas) || asignaturasDeseadas.length > 8) {
      return res.status(400).json({ message: "Se han seleccionado demasiadas asignaturas deseadas" });
    }
    if (preferencias.tam === 0) {
      return res.status(400).json({ message: "Se han de seleccionar al menos 1 asignatura para crear el horario" });
    }
    if (preferencias.tam > 8) {
      return res.status(400).json({ message: "No es posible cursar más de 8 asignaturas por cuatrimestre" });
    }

    const asignaturasDisponibles = totalAsignaturas - asignaturasCursadas.length - asignaturasExcluidas.length;
    if (asignaturasDisponibles <= 0) {
      return res.status(400).json({ message: "No quedan asignaturas disponibles para crear un horario (revisa cursadas/excluidas)." });
    }

    // Acotación del tamaño final del horario según la disponibilidad real
    const tam_horario = Math.min(preferencias.tam, asignaturasDisponibles);
    const turnosPreferidos = (preferencias.turno || []).includes('todos') ? [] : (preferencias.turno || []);

    // Gestión de identidad (Usuario persistido vs. Sesión de invitado)
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      const invitado = await User.findOne({ role: 'invitado' });
      if (!invitado) {
        return res.status(500).json({ message: 'No hay usuario invitado disponible' });
      }
      userId = invitado._id;
    }

    // Configuración de límites operacionales del motor para mitigar ataques DoS por desbordamiento de pila
    const LIMITE_SOLUCIONES = 5;
    const MAX_ITERACIONES_GRUPOS = 300;
    const MAX_COMBINACIONES_ASIGNATURAS_PROBADAS = 50;

    // ==========================================
    // SUB-PROCESO 1: SELECCIÓN Y CRUCE DE GRUPOS
    // ==========================================
    /**
     * Resuelve las combinaciones válidas de grupos para una lista dada de asignaturas.
     * @param {Object} grafo - Grafo de restricciones.
     * @param {Array<string>} combinacionFija - IDs de asignaturas fijadas.
     * @param {Array<string>} turnosPreferidosLocal - Lista de turnos asignados.
     * @param {boolean} estricto - Flag de obligatoriedad del turno.
     * @returns {Array<Object>} Lista de soluciones encontradas sin solapes.
     */
    const intentarGrupos = (grafo, combinacionFija, turnosPreferidosLocal, estricto) => {
        const generador = generadorGrupos(grafo, combinacionFija, turnosPreferidosLocal, estricto);
        const soluciones = [];
        const vistos = new Set();
        let iteraciones = 0;

        while (soluciones.length < LIMITE_SOLUCIONES && iteraciones < MAX_ITERACIONES_GRUPOS) {
            const siguiente = generador.next();
            iteraciones++;
            if (siguiente.done) break;

            const gruposElegidos = siguiente.value;
            // Clave única de serialización para deduplicación de combinaciones idénticas
            const clave = combinacionFija.map(id => `${id}:${gruposElegidos[id]?.teoria}:${gruposElegidos[id]?.practica}`).join('|');

            if (!vistos.has(clave)) {
                vistos.add(clave);
                soluciones.push({ combinacion: combinacionFija, gruposElegidos });
            }
        }
        return soluciones;
    };

    // ==========================================
    // SUB-PROCESO 2: RECORRIDO DE ASIGNATURAS
    // ==========================================
    /**
     * Consume el espacio combinatorio del generador de asignaturas e intenta acoplar los grupos horarios.
     * @param {Object} grafo - El grafo estructurado actual.
     * @param {number} intentoGenerador - Bandera de nivel para omitir prerrequisitos (0 = estricto, 1 = flexible).
     * @returns {Object|null} Devuelve la primera combinación exitosa empaquetada o null.
     */
    const buscarHorarioParaGrafo = (grafo, intentoGenerador) => {
        const candidatosProbados = [];
        const vistos = new Set();
        const generador = generadorHorarios(grafo, tam_horario, intentoGenerador, asignaturasCursadas);
        let iteraciones = 0;

        // Pasada 1: Intento de resolución respetando el turno de preferencia de forma rígida
        while (iteraciones < MAX_COMBINACIONES_ASIGNATURAS_PROBADAS) {
            const siguiente = generador.next();
            if (siguiente.done) break;
            iteraciones++;

            const combinacion = siguiente.value.combinacion;
            const clave = [...combinacion].sort().join('|');
            if (vistos.has(clave)) continue;
            vistos.add(clave);
            candidatosProbados.push(combinacion);

            const soluciones = intentarGrupos(grafo, combinacion, turnosPreferidos, true);
            if (soluciones.length > 0) {
                return { combinacion, soluciones, turnoOmitido: false };
            }
        }

        // Pasada 2 (Fallback): Si la restricción de turno esterilizó las soluciones, re-evalúa los candidatos sin ella
        if (turnosPreferidos.length > 0) {
            for (const combinacion of candidatosProbados) {
                const soluciones = intentarGrupos(grafo, combinacion, turnosPreferidos, false);
                if (soluciones.length > 0) {
                    return { combinacion, soluciones, turnoOmitido: true };
                }
            }
        }

        return null;
    };

    // ==========================================
    // BUCLE DE RELAJACIÓN ALGORÍTMICA (EVALUACIÓN)
    // ==========================================
    let resultado = null;
    let prerequisitosOmitidos = false;
    let cursoOmitido = false;
    let asignaturasDeseadasAplicadas = [...asignaturasDeseadas];
    let grafo = null;

    const opcionesCursoRestringido = preferencias.curso.length > 0 ? [true, false] : [true];

    fasePrerrequisitos:
    for (const intentoGenerador of [0, 1]) { // 0: Con Prerrequisitos, 1: Sin Prerrequisitos
        for (const cursoRestringido of opcionesCursoRestringido) { // true: Filtrar curso, false: Omitir filtro curso
            asignaturasDeseadasAplicadas = [...asignaturasDeseadas];

            // Poda iterativa hacia atrás (Back-off) de asignaturas deseadas si causan colisión sistémica
            while (true) {
                grafo = construirGrafos(asignaturas, asignaturasCursadas, asignaturasExcluidas, asignaturasDeseadasAplicadas, preferencias, itinerarios, cursoRestringido);
                resultado = buscarHorarioParaGrafo(grafo, intentoGenerador);

                if (resultado) break;
                if (asignaturasDeseadasAplicadas.length === 0) break;

                // Descarta el último elemento deseado para intentar abrir el espacio de soluciones
                asignaturasDeseadasAplicadas = asignaturasDeseadasAplicadas.slice(0, -1);
            }

            if (resultado) {
                cursoOmitido = !cursoRestringido;
                prerequisitosOmitidos = intentoGenerador === 1;
                break fasePrerrequisitos; // Solución encontrada: Sale del flujo combinatorio principal
            }
        }
    }

    // Manejo de fin de espacio sin respuestas factibles
    if (!resultado) {
      return res.status(404).json({
        message: "No se ha encontrado ningún horario posible: ninguna combinación de asignaturas admite una asignación de grupos sin solapes, ni siquiera relajando curso, asignaturas deseadas y prerrequisitos."
      });
    }

    // ==========================================
    // CONSTRUCCIÓN DE LA RESPUESTA DE SALIDA
    // ==========================================
    const { combinacion: combinacionElegida, soluciones, turnoOmitido } = resultado;

    // Generación del sistema de advertencias normativas para el Frontend
    const warnings = [];
    if (prerequisitosOmitidos) warnings.push("Aviso: Se han pasado por alto los prerrequisitos académicos para generar viabilidad.");
    if (cursoOmitido) warnings.push("Aviso: Se ha omitido la restricción de curso preferido para poder completar el horario.");
    if (turnoOmitido) warnings.push("Aviso: No se pudo cumplir el turno preferido; se incluyen asignaturas de franjas alternativas.");
    if (asignaturasDeseadas.length !== asignaturasDeseadasAplicadas.length) {
      warnings.push(`Aviso: Se han descartado ${asignaturasDeseadas.length - asignaturasDeseadasAplicadas.length} asignatura(s) deseada(s) por colisiones insalvables.`);
    }

    // Mapeo detallado de estructuras horarias cruzando IDs elegidos con los vectores de itinerarios
    const horariosCompletos = soluciones.map(sol =>
        sol.combinacion.map(id => {
            const nodo = grafo[id];
            const grupoTeoria = sol.gruposElegidos[id]?.teoria ?? null;
            const grupoPractica = sol.gruposElegidos[id]?.practica ?? null;

            const opcionTeoria = nodo.opcionesTeoria.find(o => o.grupo === grupoTeoria);
            const opcionPractica = nodo.opcionesPractica.find(o => o.grupo === grupoPractica);

            return {
                ...nodo.datos,
                grupoTeoriaElegido: grupoTeoria,
                grupoPracticaElegido: grupoPractica,
                sesionesTeoria: opcionTeoria?.sesiones ?? [],
                sesionesPractica: opcionPractica?.sesiones ?? [],
            };
        })
    );

    res.json({
        horarios: horariosCompletos,
        grafo,
        tam_horario,
        prerequisitosOmitidos,
        cursoOmitido,
        turnoOmitido,
        warnings, // Sistema de alertas unificado para inyección directa en interfaces UI
        asignaturasDeseadasAplicadas,
        asignaturasDeseadasDescartadas: asignaturasDeseadas.filter(id => !asignaturasDeseadasAplicadas.includes(id))
    });

  } catch (error) {
    console.error("Error crítico en el motor createHorariosPersonalizados:", error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la optimización de horarios' });
  }
};



/**
 * @file Transformador de estructuras de asignaturas a grafos de restricciones.
 * @description Filtra el catálogo general de asignaturas aplicando reglas de negocio y separa las sesiones temporales por modalidad (Teoría y Práctica).
 */

/**
 * Mapea y estructura las asignaturas elegibles en un objeto grafo indexado por el ID de la asignatura,
 * calculando sus pesos heurísticos y agrupando sus itinerarios horarios en bloques limpios por grupo.
 * * @param {Array<Object>} asignaturas - Catálogo completo de asignaturas provenientes de la base de datos.
 * @param {Array<string>} asignaturasCursadas - Historial de IDs de asignaturas que el usuario ya aprobó (se omiten).
 * @param {Array<string>} asignaturasExcluidas - IDs de asignaturas descartadas explícitamente por el usuario (se omiten).
 * @param {Array<string>} asignaturasDeseadas - IDs de asignaturas marcadas como prioritarias por el usuario.
 * @param {Object} preferencias - Filtros y restricciones paramétricas del usuario.
 * @param {Array<string>} preferencias.cuatrimestre - Cuatrimestres permitidos (ej. ['1']).
 * @param {Array<string>} preferencias.curso - Cursos académicos permitidos (ej. ['2', '3']).
 * @param {Array<string>} [preferencias.turno] - Franjas horarias preferidas (ej. ['mañana']). Soporta 'todos'.
 * @param {Array<Object>} itinerarios - Colección de todas las franjas horarias y sesiones de clases registradas.
 * @param {boolean} cursoRestringido - Flag que determina si se debe filtrar de forma estricta por los cursos indicados en las preferencias.
 * @returns {Object} Un objeto grafo donde las llaves son los IDs de las asignaturas y los valores contienen los pesos, metadatos y opciones horarias estructuradas.
 */
const construirGrafos = (asignaturas, asignaturasCursadas, asignaturasExcluidas, asignaturasDeseadas, preferencias, itinerarios, cursoRestringido) => {
    const grafo = {};

    for (const asig of asignaturas) {
        // PODA Y FILTRADO INICIAL: Exclusión por historial académico y listas negras
        if (asignaturasCursadas.includes(String(asig._id))) continue;
        if (asignaturasExcluidas.includes(String(asig._id))) continue;      
        
        // FILTRADO POR PREFERENCIAS: Estructuración temporal y de progresión
        if (preferencias.cuatrimestre.length > 0 && !preferencias.cuatrimestre.includes(String(asig.cuatrimestre))) continue;
        if (cursoRestringido && preferencias.curso.length > 0 && !preferencias.curso.includes(String(asig.curso))) continue;
        
        // FILTRADO POR TURNO: Ignora la restricción si se selecciona la opción comodín 'todos'
        if (preferencias.turno?.length > 0 && !preferencias.turno.includes('todos')) {
            if (asig.turno && !preferencias.turno.includes(asig.turno)) continue;
        }

        // Cálculo de prioridad heurística para el ordenamiento del Backtracking
        const peso = calcularPeso(asig, preferencias, asignaturasDeseadas);

        // ==========================================
        // PROCESAMIENTO DE ITINERARIOS DE TEORÍA
        // ==========================================
        const itinerariosTeoria = itinerarios.filter(itin =>
            String(itin.asignatura?._id || itin.asignatura) === String(asig._id) &&
            itin.modalidad === 'teoria'
        );
        
        const gruposTeoria = {};
        for (const itin of itinerariosTeoria) {
            const grupoLimpio = (itin.grupo || 'unico').trim();
            if (!gruposTeoria[grupoLimpio]) {
                gruposTeoria[grupoLimpio] = { sesiones: [], turno: itin.turno };
            }
            gruposTeoria[grupoLimpio].sesiones.push({
                dia: itin.dia?.trim(),
                hora_inicio: itin.hora_inicio?.trim(),
                hora_fin: itin.hora_fin?.trim()
            });
        }
        // Transformación de mapa de grupos a un formato plano indexable
        const opcionesTeoria = Object.entries(gruposTeoria).map(([grupo, { sesiones, turno }]) => ({ grupo, sesiones, turno }));

        // ==========================================
        // PROCESAMIENTO DE ITINERARIOS DE PRÁCTICAS
        // ==========================================
        const itinerariosPractica = itinerarios.filter(itin =>
            String(itin.asignatura?._id || itin.asignatura) === String(asig._id) &&
            itin.modalidad === 'practicas'
        );
        
        const gruposPractica = {};
        for (const itin of itinerariosPractica) {
            const grupoLimpio = (itin.grupo || 'unico').trim();
            if (!gruposPractica[grupoLimpio]) {
                gruposPractica[grupoLimpio] = { sesiones: [], turno: itin.turno };
            }
            gruposPractica[grupoLimpio].sesiones.push({
                dia: itin.dia?.trim(),
                hora_inicio: itin.hora_inicio?.trim(),
                hora_fin: itin.hora_fin?.trim()
            });
        }
        const opcionesPractica = Object.entries(gruposPractica).map(([grupo, { sesiones, turno }]) => ({ grupo, sesiones, turno }));

        // ==========================================
        // CONSTRUCCIÓN DEL NODO EN EL GRAFO
        // ==========================================
        grafo[asig._id] = {
            peso, 
            datos: asig,
            prerequisitos: (asig.prerequisitos || []).map(p => String(p)),
            opcionesTeoria,
            opcionesPractica,
        };
    }
    
    return grafo; 
};







/**
 * @file Algoritmos combinatorios y de ramificación para la generación de horarios.
 * @description Implementa generadores de backtracking (búsqueda recursiva) para resolver problemas 
 * de restricciones horarias, prerequisitos académicos y solapamiento de clases.
 */

/**
 * Generador que encuentra combinaciones válidas de asignaturas basándose en su peso, 
 * cumplimiento de prerrequisitos y disponibilidad horaria de la teoría.
 * @generator
 * @async
 * @param {Object} grafo - Grafo estructurado que contiene las asignaturas indexadas por ID.
 * @param {number} tam_horario - Cantidad objetivo de asignaturas que debe tener el horario.
 * @param {number} intento - Nivel o fase de flexibilización (ej. 0 para validar prerrequisitos estrictamente).
 * @param {Array<string>} [asignaturasCursadas=[]] - IDs de las asignaturas que el alumno ya ha aprobado históricamente.
 * @yields {Object} Un objeto que contiene el array de la `combinacion` de asignaturas y los `gruposElegidos`.
 */
function* generadorHorarios(grafo, tam_horario, intento, asignaturasCursadas = []) {
    
    /**
     * Función recursiva interna de Backtracking para explorar el espacio de soluciones de asignaturas.
     * @param {Array<string>} combinacion - Array con los IDs de las asignaturas acumuladas en la rama actual.
     * @param {Array<string>} cursadasEnHorario - Copia formateada de las asignaturas históricamente aprobadas.
     * @param {Array<Object>} horasOcupadas - Buffer acumulativo de sesiones (días y horas) ya reservadas por la rama.
     * @param {Object} gruposElegidos - Mapa clave-valor de asignaturas y sus grupos asignados.
     * @yields {Object}
     */
    function* backtrack(combinacion, cursadasEnHorario, horasOcupadas, gruposElegidos) {

        // CONDICIÓN DE ÉXITO: El tamaño de la combinación alcanza el tamaño de horario configurado
        if (combinacion.length === tam_horario) {
            yield { combinacion: [...combinacion], gruposElegidos: { ...gruposElegidos } };
            return;
        }

        // SELECCIÓN DE CANDIDATOS: Filtra repetidos y prioriza heurísticamente por peso descendente
        const candidatos = Object.keys(grafo)
            .filter(id => !combinacion.includes(id)) 
            .sort((a, b) => grafo[b].peso - grafo[a].peso); 

        // EXPLORACIÓN DEL ÁRBOL DE DECISIÓN
        for (const id of candidatos) {
            const asig = grafo[id];

            // PODA 1: Evaluación estricta de prerrequisitos académicos (solo aplica en el intento inicial o estricto)
            const prerequisitosCumplidos = asig.prerequisitos.every(preId =>
                cursadasEnHorario.includes(preId) || combinacion.includes(preId)
            );
            if (!prerequisitosCumplidos && intento == 0) continue;

            // PODA 2: Viabilidad de espacio restante en la rama (si quedan menos candidatos que huecos, rompe la rama)
            const restantes = candidatos.filter(c => !combinacion.includes(c));
            if (combinacion.length + restantes.length < tam_horario) break;

            // Fallback preventivo: Si la asignatura carece de teoría cargada, se evalúa sin restricciones
            const opciones = asig.opcionesTeoria.length > 0
                ? asig.opcionesTeoria
                : [{ grupo: null, sesiones: [] }];

            // Evaluación de solapamiento temporal para las opciones de teoría
            for (const opcion of opciones) {
                const libre = opcion.sesiones.every(sesion =>
                    horasOcupadas.every(ocupada => !seSolapan(sesion, ocupada))
                );
                if (!libre) continue; // Poda por conflicto horario: Prueba el siguiente grupo disponible

                // Llamada recursiva con ramificación profunda propagando los estados inmutables
                yield* backtrack(
                    [...combinacion, id],
                    cursadasEnHorario,
                    [...horasOcupadas, ...opcion.sesiones],  
                    { ...gruposElegidos, [id]: opcion.grupo }
                );
            }
        }
    }
    
    // Disparo inicial del proceso transformando los cursados a un formato homogéneo de cadenas
    yield* backtrack([], asignaturasCursadas.map(String), [], {});
}

/**
 * Generador que, dada una combinación estática o fija de asignaturas, calcula todas las 
 * combinaciones viables de subgrupos (Teoría + Práctica) sin que colisionen entre sí y filtrando opcionalmente por turno.
 * @generator
 * @param {Object} grafo - Grafo de dependencias con los detalles de itinerarios cargados.
 * @param {Array<string>} combinacionFija - El array de IDs de las asignaturas a las que se les busca emparejar grupos.
 * @param {Array<string>} [turnosPreferidos=[]] - Filtros específicos de franjas horarias (ej. ['Mañana', 'Tarde']).
 * @param {boolean} [estricto=true] - Si es `true`, descarta por completo los grupos que no encajen en el turno seleccionado.
 * @yields {Object} Mapa de resolución de grupos para cada asignatura de la combinación fija.
 */
function* generadorGrupos(grafo, combinacionFija, turnosPreferidos = [], estricto = true) {
    
    /**
     * Función recursiva interna de Backtracking para la asignación cruzada de grupos.
     * @param {number} index - Puntero de índice que indica qué asignatura de la lista fija se está procesando.
     * @param {Array<Object>} horasOcupadas - Historial consolidado de horas bloqueadas (Teorías + Prácticas).
     * @param {Object} gruposElegidos - Estructura resultante que mapea las decisiones tomadas de grupos.
     * @yields {Object}
     */
    function* backtrack(index, horasOcupadas, gruposElegidos) {

        // CONDICIÓN DE ÉXITO: Se ha asignado satisfactoriamente teoría y práctica a cada asignatura asignada
        if (index === combinacionFija.length) {
            yield { ...gruposElegidos };
            return;
        }

        const id = combinacionFija[index];
        const asig = grafo[id];

        // Normalización de estructuras de datos en caso de campos vacíos o sin horarios detallados
        const opcionesTeoria = asig.opcionesTeoria.length > 0 ? asig.opcionesTeoria : [{ grupo: null, sesiones: [], turno: null }];
        const opcionesPractica = asig.opcionesPractica.length > 0 ? asig.opcionesPractica : [{ grupo: null, sesiones: [], turno: null }];

        /**
         * Validador local para comprobar si una opción horaria se alinea con la restricción de turnos elegida.
         * @param {Object} opcion - Estructura de la sesión que contiene la propiedad .turno.
         * @returns {boolean} `true` si cumple con los criterios de preferencia.
         */
        const cumpleTurno = (opcion) => {
            if (turnosPreferidos.length === 0) return true;
            if (!estricto) return true;
            if (opcion.turno === null) return true; 
            return turnosPreferidos.includes(opcion.turno);
        };

        // Bucle anidado para cruzar combinaciones de teoría con práctica (Producto cartesiano controlado)
        for (const opTeoria of opcionesTeoria) {
            if (!cumpleTurno(opTeoria)) continue;

            // Validación de colisión temporal de la Teoría contra el resto del horario acumulado
            const libreTeoria = opTeoria.sesiones.every(sesion =>
                horasOcupadas.every(ocupada => !seSolapan(sesion, ocupada))
            );
            if (!libreTeoria) continue;

            for (const opPractica of opcionesPractica) {
                if (!cumpleTurno(opPractica)) continue;

                // Combinación temporal del espacio horario de la rama con la teoría actual añadida
                const ocupadasConTeoria = [...horasOcupadas, ...opTeoria.sesiones];
                
                // Validación de colisión temporal de la Práctica
                const librePractica = opPractica.sesiones.every(sesion =>
                    ocupadasConTeoria.every(ocupada => !seSolapan(sesion, ocupada))
                );
                if (!librePractica) continue;

                // Propagación recursiva hacia el siguiente índice de asignatura de la combinación fija
                yield* backtrack(
                    index + 1,
                    [...ocupadasConTeoria, ...opPractica.sesiones],
                    { ...gruposElegidos, [id]: { teoria: opTeoria.grupo, practica: opPractica.grupo } }
                );
            }
        }
    }
    
    // Inicialización del árbol recursivo apuntando a la primera asignatura (índice 0)
    yield* backtrack(0, [], {});
}





/**
 * @file Algoritmo de puntuación heurística para la priorización de asignaturas.
 * @description Calcula la relevancia de una asignatura basándose en criterios de selección y preferencias del usuario.
 */

/**
 * Calcula el peso numérico (puntuación de prioridad) de una asignatura basándose 
 * en las asignaturas deseadas y las preferencias paramétricas del usuario.
 * * @param {Object} asig - El objeto asignatura a evaluar de la base de datos.
 * @param {string|Object} asig._id - Identificador único de la asignatura.
 * @param {number|string} asig.curso - Curso académico al que pertenece la asignatura.
 * @param {string} asig.dificultad - Nivel de complejidad ('baja', 'moderada', 'media', 'alta').
 * @param {Object} preferencias - Objeto que contiene las preferencias de filtrado del usuario.
 * @param {Array<string>} preferencias.curso - Lista de cursos preferidos por el usuario.
 * @param {Array<string>} preferencias.dificultad - Lista de niveles de dificultad seleccionados por el usuario.
 * @param {Array<string>} asignaturasDeseadas - Array de IDs de asignaturas marcadas explícitamente como prioritarias o requeridas.
 * @returns {number} El peso total calculado (a mayor valor, mayor prioridad en el algoritmo de ordenación).
 */
const calcularPeso = (asig, preferencias, asignaturasDeseadas) => {
    let peso = 0;

    // Criterio principal: Si la asignatura fue seleccionada directamente por el usuario (+10 puntos)
    if (asignaturasDeseadas.includes(String(asig._id))) peso += 10;

    // Nota: El filtrado por turno está deshabilitado temporalmente en la implementación actual
    // if (preferencias.turno.length > 0 && preferencias.turno.includes(String(asig.turno))) peso += 3;
    
    // Criterio secundario: Coincidencia con los cursos preferidos (+4 puntos)
    if (preferencias.curso.length > 0 && preferencias.curso.includes(String(asig.curso))) peso += 4;

    // Criterio terciario: Evaluación por nivel de dificultad
    if (preferencias.dificultad.length === 0) {
        // Puntuación por defecto si el usuario no parametrizó sus preferencias de dificultad
        if (asig.dificultad === 'moderada') peso += 3;
        else if (asig.dificultad === 'media' || asig.dificultad === 'alta') peso += 2;
        else peso += 1;
    } else {
        // Puntuación dinámica basada en la coincidencia exacta de dificultades deseadas
        if (preferencias.dificultad.includes(asig.dificultad)) peso += 3;
        else peso += 1;
    }

    return peso;
};




/**
 * @file Utilidades de gestión del tiempo y detección de conflictos de horarios.
 * @description Convierte cadenas de tiempo en minutos y calcula solapamientos entre itinerarios.
 */

/**
 * Convierte una hora en formato de cadena (HH:MM) a su equivalente absoluto en minutos desde la medianoche.
 * @param {string} hora - Cadena de texto que representa la hora en formato "HH:MM" (ej. "14:30").
 * @returns {number} Cantidad total de minutos transcurridos (ej. "02:00" retorna 120).
 */
const HORA_A_MIN = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Determina si dos eventos o itinerarios se solapan en el tiempo durante el mismo día.
 * @param {Object} a - Primer objeto de itinerario a comparar.
 * @param {string} a.dia - Día de la semana del primer itinerario.
 * @param {string} a.hora_inicio - Hora de inicio en formato "HH:MM".
 * @param {string} a.hora_fin - Hora de finalización en formato "HH:MM".
 * @param {Object} b - Segundo objeto de itinerario a comparar.
 * @param {string} b.dia - Día de la semana del segundo itinerario.
 * @param {string} b.hora_inicio - Hora de inicio en formato "HH:MM".
 * @param {string} b.hora_fin - Hora de finalización en formato "HH:MM".
 * @returns {boolean} Retorna `true` si los itinerarios ocurren el mismo día y sus intervalos de tiempo se intersectan; de lo contrario, `false`.
 */
const seSolapan = (a, b) => {
  if (a.dia !== b.dia) return false;
  const inicioA = HORA_A_MIN(a.hora_inicio), finA = HORA_A_MIN(a.hora_fin);
  const inicioB = HORA_A_MIN(b.hora_inicio), finB = HORA_A_MIN(b.hora_fin);
  return inicioA < finB && inicioB < finA; // Solape estricto de intervalos temporales
};
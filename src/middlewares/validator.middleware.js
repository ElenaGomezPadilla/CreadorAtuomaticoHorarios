export const validateSchema = (schema) => async (req, res, next) => {
    try{
        // Validación del schema
        await schema.parseAsync(req.body);
        next(); // Si la validación pasa, continua con el siguiente middleware
    }catch(error){
        // Si hay un error, devuelve una respuesta con el código 400 y los mensajes de error
        return res
            .status(400)
            .json(error.errors.map((err) => err.message)); 
    }
};


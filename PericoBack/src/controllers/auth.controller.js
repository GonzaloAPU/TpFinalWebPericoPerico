const jwt = require('jsonwebtoken'); 
const authCtrl = {} 
 
authCtrl.verifyToken = async (req, res, next) => { 
    // 1. Validar si el header existe antes de hacer split 
    const authHeader = req.headers.authorization; 
    if (!authHeader) { 
        return res.status(401).json({ message: 'Unauthorized request: No token provided.' }); 
    } 
 
    // 2. Extraer el token separando por el espacio 
    const token = authHeader.split(' ')[1]; 
     
    // 3. Validar que el token no sea undefined o esté vacío 
    if (!token || token === 'null') { 
        return res.status(401).json({ message: 'Unauthorized request: Invalid token format.' }); 
    } 
 
    try { 
        // 4. Capturar errores de verificación (token expirado, firma inválida, etc.) 
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        req.usuario = decoded;

        next(); 
    } catch (error) { 
        return res.status(401).json({ message: 'Unauthorized request: Invalid or expired token.' }); 
    } 
} 
module.exports = authCtrl; 

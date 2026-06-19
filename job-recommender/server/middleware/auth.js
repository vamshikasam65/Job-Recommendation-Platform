import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Expect token format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token format invalid. Use "Bearer <token>".' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecrettoken12345');
    // Assign user payload to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session invalid or expired. Please log in again.' });
  }
};

export default auth;

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from './db.js';
import authMiddleware, { JWT_SECRET } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Helper function to validate user inputs
function validateAuthInput(username, password) {
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return 'O nome de usuário deve ter pelo menos 3 caracteres.';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
}

// Route: Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  const validationError = validateAuthInput(username, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (existingUser) {
      return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username.trim(), hashedPassword]
    );

    return res.status(201).json({ message: 'Usuário registrado com sucesso.' });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ message: 'Erro interno no servidor ao registrar usuário.' });
  }
});

// Route: Login user
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const db = await getDatabase();

    // Find user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no servidor ao fazer login.' });
  }
});

// Route: Protected Dashboard Sales Data
app.get('/api/dashboard', authMiddleware, (req, res) => {
  // Returns mock sales statistics for Hastam Motors
  const mockData = {
    totalSales: 1850000,
    carsSold: 42,
    averagePrice: 44050,
    topModel: "Hastam Cyber Coupe",
    monthlyTargetProgress: 84,
    recentSales: [
      { id: 1, model: "Hastam Cyber Coupe", price: 85000, client: "Carlos Andrade", date: "2026-05-27", status: "Concluída" },
      { id: 2, model: "Hastam Roadster GT", price: 120000, client: "Juliana Silveira", date: "2026-05-26", status: "Pendente" },
      { id: 3, model: "Hastam Urban X", price: 45000, client: "Renato Santos", date: "2026-05-25", status: "Concluída" },
      { id: 4, model: "Hastam Electro SUV", price: 68000, client: "Mariana Costa", date: "2026-05-22", status: "Cancelada" }
    ]
  };

  return res.json(mockData);
});

// Initialize database then start listening
async function startServer() {
  try {
    console.log('Inicializando banco de dados...');
    await getDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando offline na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();

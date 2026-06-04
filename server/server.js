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

// --- CRUD VENDEDORES ---

// GET: List all sellers
app.get('/api/vendedores', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const sellers = await db.all(`
      SELECT v.id, v.nome, 
             (SELECT COUNT(*) FROM vendas WHERE vendedor_id = v.id) as sales_count
      FROM vendedores v
      ORDER BY v.nome ASC
    `);
    
    return res.json(sellers.map(s => ({
      id: s.id,
      nome: s.nome,
      hasSales: s.sales_count > 0
    })));
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return res.status(500).json({ message: 'Erro ao buscar vendedores.' });
  }
});

// POST: Create a seller
app.post('/api/vendedores', authMiddleware, async (req, res) => {
  const { nome } = req.body;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ message: 'O nome do vendedor é obrigatório.' });
  }

  try {
    const db = await getDatabase();
    await db.run('INSERT INTO vendedores (nome) VALUES (?)', [nome.trim()]);
    return res.status(201).json({ message: 'Vendedor cadastrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    return res.status(500).json({ message: 'Erro ao criar vendedor.' });
  }
});

// DELETE: Delete a seller
app.delete('/api/vendedores/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    const linked = await db.get('SELECT COUNT(*) as count FROM vendas WHERE vendedor_id = ?', [id]);
    if (linked && linked.count > 0) {
      return res.status(400).json({ message: 'Não é possível excluir: existem vendas vinculadas a este cadastro.' });
    }

    await db.run('DELETE FROM vendedores WHERE id = ?', [id]);
    return res.json({ message: 'Vendedor excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir vendedor:', error);
    return res.status(500).json({ message: 'Erro ao excluir vendedor.' });
  }
});


// --- CRUD CANAIS DE ORIGEM ---

// GET: List all origin channels
app.get('/api/canais-origem', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const channels = await db.all(`
      SELECT c.id, c.nome, 
             (SELECT COUNT(*) FROM vendas WHERE origem_id = c.id) as sales_count
      FROM canais_origem c
      ORDER BY c.nome ASC
    `);

    return res.json(channels.map(c => ({
      id: c.id,
      nome: c.nome,
      hasSales: c.sales_count > 0
    })));
  } catch (error) {
    console.error('Erro ao buscar canais de origem:', error);
    return res.status(500).json({ message: 'Erro ao buscar canais de origem.' });
  }
});

// POST: Create an origin channel
app.post('/api/canais-origem', authMiddleware, async (req, res) => {
  const { nome } = req.body;
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ message: 'O nome do canal é obrigatório.' });
  }

  try {
    const db = await getDatabase();
    await db.run('INSERT INTO canais_origem (nome) VALUES (?)', [nome.trim()]);
    return res.status(201).json({ message: 'Canal de origem cadastrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar canal de origem:', error);
    return res.status(500).json({ message: 'Erro ao criar canal de origem.' });
  }
});

// DELETE: Delete an origin channel
app.delete('/api/canais-origem/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    const linked = await db.get('SELECT COUNT(*) as count FROM vendas WHERE origem_id = ?', [id]);
    if (linked && linked.count > 0) {
      return res.status(400).json({ message: 'Não é possível excluir: existem vendas vinculadas a este cadastro.' });
    }

    await db.run('DELETE FROM canais_origem WHERE id = ?', [id]);
    return res.json({ message: 'Canal de origem excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir canal de origem:', error);
    return res.status(500).json({ message: 'Erro ao excluir canal de origem.' });
  }
});


// --- METAS ---

// POST: Create or Update (Upsert) goal
app.post('/api/metas', authMiddleware, async (req, res) => {
  const { mes, ano, qtd_carros_importacao, valor_meta_estoque } = req.body;
  
  if (mes === undefined || ano === undefined || qtd_carros_importacao === undefined || valor_meta_estoque === undefined) {
    return res.status(400).json({ message: 'Todos os campos de metas são obrigatórios.' });
  }

  const mesInt = parseInt(mes, 10);
  const anoInt = parseInt(ano, 10);
  const qtdInt = parseInt(qtd_carros_importacao, 10);
  const valorInt = parseInt(valor_meta_estoque, 10);

  if (isNaN(mesInt) || mesInt < 1 || mesInt > 12 || isNaN(anoInt) || isNaN(qtdInt) || isNaN(valorInt)) {
    return res.status(400).json({ message: 'Valores fornecidos para metas são inválidos.' });
  }

  try {
    const db = await getDatabase();
    await db.run(`
      INSERT INTO metas (mes, ano, qtd_carros_importacao, valor_meta_estoque)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(mes, ano) DO UPDATE SET
        qtd_carros_importacao = excluded.qtd_carros_importacao,
        valor_meta_estoque = excluded.valor_meta_estoque
    `, [mesInt, anoInt, qtdInt, valorInt]);

    return res.json({ message: 'Metas salvas com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar metas:', error);
    return res.status(500).json({ message: 'Erro ao salvar metas.' });
  }
});


// --- VENDAS ---

// POST: Add new sale
app.post('/api/vendas', authMiddleware, async (req, res) => {
  const { categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda } = req.body;

  if (!categoria || !modelo_carro || !vendedor_id || !origem_id || valor === undefined) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios da venda devem ser informados.' });
  }

  if (categoria !== 'importacao' && categoria !== 'estoque') {
    return res.status(400).json({ message: 'Categoria inválida. Deve ser "importacao" ou "estoque".' });
  }

  const valorReais = parseFloat(valor);
  if (isNaN(valorReais) || valorReais <= 0) {
    return res.status(400).json({ message: 'O valor da venda deve ser um número positivo.' });
  }
  const valorCentavos = Math.round(valorReais * 100);

  // Fallback to current timestamp if data_venda is not provided
  const finalDataVenda = data_venda || new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const db = await getDatabase();

    // Verify relations exist
    const vendor = await db.get('SELECT id FROM vendedores WHERE id = ?', [vendedor_id]);
    if (!vendor) {
      return res.status(400).json({ message: 'Vendedor não encontrado.' });
    }

    const origin = await db.get('SELECT id FROM canais_origem WHERE id = ?', [origem_id]);
    if (!origin) {
      return res.status(400).json({ message: 'Canal de origem não encontrado.' });
    }

    await db.run(`
      INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [categoria, modelo_carro.trim(), vendedor_id, origem_id, valorCentavos, finalDataVenda]);

    return res.status(201).json({ message: 'Venda cadastrada com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return res.status(500).json({ message: 'Erro ao criar venda.' });
  }
});

// DELETE: Delete a sale
app.delete('/api/vendas/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    const sale = await db.get('SELECT id FROM vendas WHERE id = ?', [id]);
    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada.' });
    }

    await db.run('DELETE FROM vendas WHERE id = ?', [id]);
    return res.json({ message: 'Venda excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    return res.status(500).json({ message: 'Erro ao excluir venda.' });
  }
});

// GET: Export sales in period
app.get('/api/vendas/exportar', authMiddleware, async (req, res) => {
  const { dataInicio, dataFim } = req.query;

  const start = dataInicio ? `${dataInicio} 00:00:00` : '1970-01-01 00:00:00';
  const end = dataFim ? `${dataFim} 23:59:59` : '2999-12-31 23:59:59';

  try {
    const db = await getDatabase();
    const sales = await db.all(`
      SELECT v.id, v.categoria, v.modelo_carro, v.valor, v.data_venda,
             vd.nome as vendedor_nome, co.nome as origem_nome
      FROM vendas v
      JOIN vendedores vd ON v.vendedor_id = vd.id
      JOIN canais_origem co ON v.origem_id = co.id
      WHERE v.data_venda >= ? AND v.data_venda <= ?
      ORDER BY v.data_venda DESC
    `, [start, end]);

    return res.json(sales);
  } catch (error) {
    console.error('Erro ao exportar vendas:', error);
    return res.status(500).json({ message: 'Erro ao exportar vendas.' });
  }
});


// --- DASHBOARD REFATORADO ---

// GET: Get dashboard analytics for month/year
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const now = new Date();
  const mes = req.query.mes ? parseInt(req.query.mes, 10) : (now.getMonth() + 1);
  const ano = req.query.ano ? parseInt(req.query.ano, 10) : now.getFullYear();

  if (isNaN(mes) || mes < 1 || mes > 12 || isNaN(ano)) {
    return res.status(400).json({ message: 'Mês ou ano inválidos.' });
  }

  const mesStr = String(mes).padStart(2, '0');
  const anoStr = String(ano);

  try {
    const db = await getDatabase();

    // Fetch sales for specified month & year
    const sales = await db.all(`
      SELECT v.id, v.categoria, v.modelo_carro, v.valor, v.data_venda,
             vd.nome as vendedor_nome, co.nome as origem_nome
      FROM vendas v
      JOIN vendedores vd ON v.vendedor_id = vd.id
      JOIN canais_origem co ON v.origem_id = co.id
      WHERE strftime('%Y', v.data_venda) = ? AND strftime('%m', v.data_venda) = ?
    `, [anoStr, mesStr]);

    // Fetch meta for specified month & year
    const meta = await db.get('SELECT * FROM metas WHERE mes = ? AND ano = ?', [mes, ano]);
    const defaultMeta = meta || { qtd_carros_importacao: 0, valor_meta_estoque: 0 };

    // --- Categoria Importação ---
    const importacaoSales = sales.filter(s => s.categoria === 'importacao');
    const totalCarsImportacao = importacaoSales.length;
    const modelosImportacao = [...new Set(importacaoSales.map(s => s.modelo_carro))];

    const rankingImportacaoMap = {};
    importacaoSales.forEach(s => {
      rankingImportacaoMap[s.vendedor_nome] = (rankingImportacaoMap[s.vendedor_nome] || 0) + 1;
    });
    const rankingVendedoresImportacao = Object.entries(rankingImportacaoMap)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    const metaQtd = defaultMeta.qtd_carros_importacao;
    const progressoPercentualImportacao = metaQtd > 0 ? Math.min(100, Math.round((totalCarsImportacao * 100) / metaQtd)) : 0;
    const restanteImportacao = Math.max(0, metaQtd - totalCarsImportacao);

    // --- Categoria Estoque ---
    const estoqueSales = sales.filter(s => s.categoria === 'estoque');
    const valorTotalEstoque = estoqueSales.reduce((sum, s) => sum + s.valor, 0);

    const rankingEstoqueMap = {};
    estoqueSales.forEach(s => {
      rankingEstoqueMap[s.vendedor_nome] = (rankingEstoqueMap[s.vendedor_nome] || 0) + s.valor;
    });
    const rankingVendedoresEstoque = Object.entries(rankingEstoqueMap)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);

    const metaValor = defaultMeta.valor_meta_estoque;
    const progressoPercentualEstoque = metaValor > 0 ? Math.min(100, Math.round((valorTotalEstoque * 100) / metaValor)) : 0;
    const restanteEstoque = Math.max(0, metaValor - valorTotalEstoque);

    // --- Gráfico de Evolução ---
    const daysInMonth = new Date(ano, mes, 0).getDate();
    const dailyImportacao = Array(daysInMonth + 1).fill(0);
    const dailyEstoque = Array(daysInMonth + 1).fill(0);

    sales.forEach(s => {
      let day = null;
      const match = s.data_venda.match(/\d{4}-\d{2}-(\d{2})/);
      if (match) {
        day = parseInt(match[1], 10);
      } else {
        const dateObj = new Date(s.data_venda);
        day = dateObj.getDate();
      }

      if (day && day >= 1 && day <= daysInMonth) {
        if (s.categoria === 'importacao') {
          dailyImportacao[day] += 1;
        } else if (s.categoria === 'estoque') {
          dailyEstoque[day] += s.valor;
        }
      }
    });

    const evolution = [];
    let accumImportacao = 0;
    let accumEstoque = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      accumImportacao += dailyImportacao[d];
      accumEstoque += dailyEstoque[d];
      evolution.push({
        dia: d,
        importacao: accumImportacao,
        estoque: accumEstoque
      });
    }

    return res.json({
      mes,
      ano,
      importacao: {
        total_carros: totalCarsImportacao,
        modelos: modelosImportacao,
        ranking_vendedores: rankingVendedoresImportacao,
        meta_qtd: metaQtd,
        progresso_percentual: progressoPercentualImportacao,
        restante: restanteImportacao
      },
      estoque: {
        valor_total: valorTotalEstoque,
        ranking_vendedores: rankingVendedoresEstoque,
        meta_valor: metaValor,
        progresso_percentual: progressoPercentualEstoque,
        restante: restanteEstoque
      },
      evolution,
      vendas: sales // Also sending all raw sales for details lists if needed
    });
  } catch (error) {
    console.error('Erro ao processar dados do dashboard:', error);
    return res.status(500).json({ message: 'Erro ao carregar telemetria do dashboard.' });
  }
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

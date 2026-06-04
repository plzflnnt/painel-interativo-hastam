import bcrypt from 'bcryptjs';
import { getDatabase } from './db.js';

async function seed() {
  try {
    console.log('Iniciando o povoamento do banco de dados...');
    const db = await getDatabase();

    // Disable foreign keys temporarily to drop tables cleanly
    await db.run('PRAGMA foreign_keys = OFF');

    // Drop tables if they exist to start fresh
    await db.exec(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS vendas;
      DROP TABLE IF EXISTS metas;
      DROP TABLE IF EXISTS vendedores;
      DROP TABLE IF EXISTS canais_origem;
    `);

    // Re-enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');

    // Recreate tables by calling the initialization query again
    // (In db.js, getDatabase() runs CREATE TABLE IF NOT EXISTS, but let's run them explicitly here to be 100% sure they are created)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vendedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS canais_origem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT NOT NULL CHECK(categoria IN ('importacao', 'estoque')),
        modelo_carro TEXT NOT NULL,
        vendedor_id INTEGER NOT NULL,
        origem_id INTEGER NOT NULL,
        valor INTEGER NOT NULL,
        data_venda DATETIME NOT NULL,
        FOREIGN KEY (vendedor_id) REFERENCES vendedores(id),
        FOREIGN KEY (origem_id) REFERENCES canais_origem(id)
      );

      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
        ano INTEGER NOT NULL,
        qtd_carros_importacao INTEGER NOT NULL,
        valor_meta_estoque INTEGER NOT NULL,
        UNIQUE(mes, ano)
      );
    `);

    // 1. Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      ['admin', hashedPassword]
    );
    console.log('✅ Usuário administrador criado: admin / admin123');

    // 2. Create 3 sellers
    const vendedores = ['Lucas Silva', 'Ana Oliveira', 'Pedro Costa'];
    for (const nome of vendedores) {
      await db.run('INSERT INTO vendedores (nome) VALUES (?)', [nome]);
    }
    console.log('✅ 3 Vendedores criados.');

    // 3. Create 3 origin channels
    const canais = ['Instagram', 'Website', 'Indicação'];
    for (const nome of canais) {
      await db.run('INSERT INTO canais_origem (nome) VALUES (?)', [nome]);
    }
    console.log('✅ 3 Canais de origem criados.');

    // Get current month and year dynamically
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentMonthStr = String(currentMonth).padStart(2, '0');

    // 4. Create 5 mock sales in the current month
    // Sale 1: Importacao, Porsche 911 Carrera S, Lucas Silva (1), Instagram (1), R$ 920.000,00 (92000000 cents)
    await db.run(
      `INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['importacao', 'Porsche 911 Carrera S', 1, 1, 92000000, `${currentYear}-${currentMonthStr}-03 14:30:00`]
    );

    // Sale 2: Estoque, Porsche Taycan 4S, Ana Oliveira (2), Website (2), R$ 750.000,00 (75000000 cents)
    await db.run(
      `INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['estoque', 'Porsche Taycan 4S', 2, 2, 75000000, `${currentYear}-${currentMonthStr}-05 10:15:00`]
    );

    // Sale 3: Importacao, Porsche Cayenne E-Hybrid, Pedro Costa (3), Indicação (3), R$ 820.000,00 (82000000 cents)
    await db.run(
      `INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['importacao', 'Porsche Cayenne E-Hybrid', 3, 3, 82000000, `${currentYear}-${currentMonthStr}-12 16:45:00`]
    );

    // Sale 4: Estoque, Porsche Macan GTS, Lucas Silva (1), Website (2), R$ 630.000,00 (63000000 cents)
    await db.run(
      `INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['estoque', 'Porsche Macan GTS', 1, 2, 63000000, `${currentYear}-${currentMonthStr}-18 11:00:00`]
    );

    // Sale 5: Importacao, Porsche Boxster 718, Ana Oliveira (2), Instagram (1), R$ 540.000,00 (54000000 cents)
    await db.run(
      `INSERT INTO vendas (categoria, modelo_carro, vendedor_id, origem_id, valor, data_venda) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['importacao', 'Porsche Boxster 718', 2, 1, 54000000, `${currentYear}-${currentMonthStr}-24 09:30:00`]
    );
    console.log('✅ 5 Vendas fictícias criadas para o mês atual.');

    // 5. Create default goal for current month
    // Goal: 4 import cars, R$ 2.000.000,00 stock sales (200000000 cents)
    await db.run(
      `INSERT INTO metas (mes, ano, qtd_carros_importacao, valor_meta_estoque) 
       VALUES (?, ?, ?, ?)`,
      [currentMonth, currentYear, 4, 200000000]
    );
    console.log(`✅ Metas padrão criadas para ${currentMonthStr}/${currentYear}: 4 carros de importação, R$ 2.000.000,00 em estoque.`);

    console.log('Povoamento concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao povoar o banco de dados:', error);
    process.exit(1);
  }
}

seed();

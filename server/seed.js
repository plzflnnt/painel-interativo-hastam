import bcrypt from 'bcryptjs';
import { getDatabase } from './db.js';

async function seed() {
  try {
    console.log('Iniciando o povoamento do banco de dados...');
    const db = await getDatabase();

    // Check if admin user already exists
    const adminUser = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);

    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['admin', hashedPassword]
      );
      console.log('✅ Usuário administrador inicial criado com sucesso: admin / admin123');
    } else {
      console.log('ℹ️ Usuário administrador já existe no banco de dados.');
    }

    console.log('Povoamento concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao povoar o banco de dados:', error);
    process.exit(1);
  }
}

seed();

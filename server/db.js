import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');

let dbInstance = null;

export async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  // Open the database file
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.get("PRAGMA foreign_keys = ON");

  // Create tables if they do not exist
  await dbInstance.exec(`
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

  return dbInstance;
}

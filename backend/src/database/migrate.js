const pool = require('./connection')

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        email         VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela users criada!')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(100) NOT NULL,
        description TEXT,
        tech_stack  JSON,
        github_url  VARCHAR(255),
        live_url    VARCHAR(255),
        thumbnail   VARCHAR(255),
        featured    BOOLEAN DEFAULT false,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela projects criada!')

    console.log('🎉 Migrate concluído!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro no migrate:', err)
    process.exit(1)
  }
}

migrate()
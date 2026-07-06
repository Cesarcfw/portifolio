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
        status      VARCHAR(50) DEFAULT 'concluido',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela projects criada!')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key   VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
      )
    `)
    console.log('✅ Tabela settings criada!')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(50) NOT NULL,
        category    VARCHAR(50) NOT NULL,
        level       INT DEFAULT 80,
        color       VARCHAR(20) DEFAULT '#00f0ff',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela skills criada!')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        company     VARCHAR(100) NOT NULL,
        role        VARCHAR(100) NOT NULL,
        period      VARCHAR(50) NOT NULL,
        description TEXT,
        techs       VARCHAR(255) DEFAULT '',
        type        VARCHAR(20) DEFAULT 'work',
        order_index INT DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabela experiences criada!')

    console.log('🎉 Migrate concluído!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro no migrate:', err)
    process.exit(1)
  }
}

migrate()
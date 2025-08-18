const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para criar a tabela se ela não existir
async function createTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ranking (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255) NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Tabela 'ranking' verificada/criada com sucesso.");
  } catch (err) {
    console.error("Erro ao criar a tabela:", err);
  } finally {
    client.release();
  }
}

// Chama a função para garantir que a tabela existe ao iniciar o servidor
createTable();

// Endpoint para obter o ranking
app.get('/vendas', async (req, res) => {
  try {
    const result = await pool.query('SELECT player_name, score FROM ranking ORDER BY score DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar o ranking:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Endpoint para adicionar um novo registro de venda
app.post('/vendas', async (req, res) => {
  const { player, score } = req.body;

  if (!player || typeof score !== 'number') {
    return res.status(400).json({ error: "Dados inválidos: 'player' e 'score' são obrigatórios." });
  }

  try {
    // Verifica se o player já existe
    const existingPlayer = await pool.query('SELECT * FROM ranking WHERE player_name = $1', [player]);
    if (existingPlayer.rows.length > 0) {
        // Se o player existe, atualiza a pontuação
        await pool.query('UPDATE ranking SET score = score + $1 WHERE player_name = $2', [score, player]);
        res.status(200).json({ message: "Pontuação atualizada com sucesso!" });
    } else {
        // Se o player não existe, cria um novo registro
        await pool.query('INSERT INTO ranking(player_name, score) VALUES($1, $2)', [player, score]);
        res.status(201).json({ message: "Novo jogador adicionado com sucesso!" });
    }
  } catch (err) {
    console.error("Erro ao processar a requisição POST:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

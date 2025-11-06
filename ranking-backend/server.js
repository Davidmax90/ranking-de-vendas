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
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        meta DECIMAL(10, 2) NOT NULL,
        resultado DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255),
        role VARCHAR(50) NOT NULL
      );
    `;
    await client.query(createTableQuery);

    console.log("Tabela 'sellers' verificada/criada com sucesso.");

    // Populando a tabela com os dados iniciais, se ela estiver vazia
    const countQuery = await client.query('SELECT COUNT(*) FROM sellers');
    if (countQuery.rows[0].count == 0) {
      console.log("Tabela vazia. Populando com dados iniciais...");
      const initialData = [
        { name: "Raul", meta: 0, resultado: 0, image: "images/lider-raul.png", role: "leader" },
        { name: "Alex", meta: 0, resultado: 0, image: "images/alex.png", role: "member" },
        { name: "Amanda", meta: 0, resultado: 0, image: "images/amanda.png", role: "member" },
        { name: "André", meta: 0, resultado: 0, image: "images/andre.png", role: "member" },
        { name: "David", meta: 0, resultado: 0, image: "images/david.png", role: "member" },
        { name: "Clailton", meta: 0, resultado: 0, image: "images/clailton.png", role: "member" },
        { name: "Jossiane", meta: 0, resultado: 0, image: "images/jossiane.png", role: "member" },
        { name: "João", meta: 0, resultado: 0, image: "images/joao.png", role: "member" }
      ];

      for (const seller of initialData) {
        await client.query(
          'INSERT INTO sellers(name, meta, resultado, image, role) VALUES($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING',
          [seller.name, seller.meta, seller.resultado, seller.image, seller.role]
        );
      }
      console.log("Dados iniciais populados com sucesso.");
    }

  } catch (err) {
    console.error("Erro ao configurar o banco de dados:", err);
  } finally {
    client.release();
  }
}

// Chama a função para garantir que a tabela existe e está populada
createTable();

// Endpoint para obter todos os vendedores
app.get('/sellers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sellers ORDER BY resultado DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erro ao buscar vendedores:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Endpoint para obter um vendedor específico pelo nome
app.get('/sellers/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM sellers WHERE name = $1', [name]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Vendedor não encontrado." });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar vendedor:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Endpoint para atualizar os dados de um vendedor (o PUT do seu frontend)
app.put('/sellers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, meta, resultado, image, role } = req.body;

  try {
    const result = await pool.query(
      'UPDATE sellers SET name = $1, meta = $2, resultado = $3, image = $4, role = $5 WHERE id = $6 RETURNING *',
      [name, meta, resultado, image, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendedor não encontrado." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar vendedor:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

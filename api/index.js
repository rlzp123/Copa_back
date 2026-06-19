const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Verifica se tem as variáveis de ambiente do Supabase
// Se não tiver, pode rodar simulando um erro amigável ou usando banco em memória falso (se o usuário não configurou)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

app.get('/api', (req, res) => {
    res.json({ message: "API Copa Mercado Online!" });
});

// GET /api/produtos
app.get('/api/produtos', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const { data, error } = await supabase.from('produtos').select('*').order('id', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// GET /api/pessoas
app.get('/api/pessoas', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const { data, error } = await supabase.from('pessoas_proximas').select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// GET /api/pedidos/:cliente
app.get('/api/pedidos/:cliente', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const cliente = req.params.cliente;
    const { data, error } = await supabase.from('pedidos').select('*').eq('cliente', cliente);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// POST /api/pedidos
app.post('/api/pedidos', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const { cliente, pagamento, itens, total, carrinho } = req.body;
    
    const dataAtual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Insere o pedido
    const { data, error } = await supabase.from('pedidos').insert([
        { cliente, pagamento, itens, total, data: dataAtual, status: 'pendente' }
    ]).select();

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza o estoque (simplificado, ignorando transações)
    if (carrinho && Array.isArray(carrinho)) {
        for (let item of carrinho) {
            await supabase.rpc('decrementar_estoque', { produto_id: item.id }); 
            // Para simplicidade se a RPC não existir:
            // O código de produção leria e escreveria o estoque.
        }
    }

    res.json({ message: "Pedido criado com sucesso", pedido: data[0] });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const { email, password } = req.body;
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
    
    if (error || !data) return res.status(401).json({ error: "Usuário não encontrado." });
    if (data.senha !== password) return res.status(401).json({ error: "Senha inválida." });
    
    res.json({ usuario: data });
});

// POST /api/register
app.post('/api/register', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase não configurado" });
    const { nome, email, password } = req.body;
    
    const { data, error } = await supabase.from('usuarios').insert([
        { nome_exibicao: nome, email, senha: password, avatar_src: './img-avatares/vini.jpg' }
    ]).select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ usuario: data[0] });
});

// Necessário para Vercel Serverless
module.exports = app;

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`API rodando na porta ${port}`));
}

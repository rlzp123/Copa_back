/**
 * Mercado da Copa — API
 * Express + Supabase, com autenticação JWT e senhas hasheadas (bcryptjs).
 *
 * - Se SUPABASE_URL / SUPABASE_ANON_KEY estiverem definidos, usa o banco real.
 * - Se não, entra em "modo simulado" com dados em memória, para rodar localmente
 *   sem configurar nada (o front-end também tem fallback local).
 *
 * Endpoints (base: /api):
 *   POST   /login                 { email, password }            -> { usuario, token }
 *   POST   /register              { nome, email, password }      -> { usuario, token }
 *   GET    /produtos                                             -> [produto]
 *   GET    /pessoas                                                -> [pessoa]
 *   GET    /pedidos/:cliente                                        -> [pedido]
 *   POST   /pedidos            { cliente, pagamento, itens, total }-> { message, pedido }
 *   PATCH  /perfil             (autenticado)                     -> { usuario }
 *   GET    /vendas                                                 -> [venda]
 *   POST   /vendas             (autenticado)                     -> { venda }
 *   DELETE /vendas/:id        (autenticado)                     -> { message }
 *   GET    /trocas                                                 -> [proposta]
 *   POST   /trocas             (autenticado)                     -> { proposta }
 *   POST   /trocas/:id/status  (autenticado) { status }          -> { message }
 *   GET    /chats/:propostaId                                        -> [mensagem]
 *   POST   /chats/:propostaId  (autenticado) { texto }           -> { mensagem }
 *   GET    /avaliacoes/produto/:id                                  -> [avaliacao]
 *   POST   /avaliacoes         (autenticado)                     -> { avaliacao }
 *   GET    /favoritos/:email                                        -> [produtoId]
 *   POST   /favoritos           (autenticado) { produtoId }      -> { favoritos }
 *   GET    /notificacoes/:email                                    -> [notificacao]
 *   POST   /notificacoes        (autenticado) { texto, tipo }    -> { notificacao }
 */
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
)

const JWT_SECRET = process.env.JWT_SECRET || 'copa-dev-secret-mude-em-producao'
const TOKEN_EXPIRES = '7d'

// Formatação manual de data/hora (sem depender de ICU com dateStyle inválido)
function formatDateBR() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatTimeBR() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/* ------------------------------------------------------------------ */
/* Modo simulado (sem Supabase configurado)                            */
/* ------------------------------------------------------------------ */
const mem = {
  usuarios: [
    { id: 1, nome_exibicao: 'Torcedor Demo', email: 'demo@copa.com', senha: bcrypt.hashSync('123456', 8), avatar_src: '/img-avatares/vini.jpg' },
  ],
  produtos: [
    { id: 1, nome: 'Camisa Brasil 1970', preco: 249.90, estoque: 4, img: '/img-vendas/camisa_1970_Brasil.jpg', desc: 'Relíquia da seleção tricampeã mundial.' },
    { id: 2, nome: 'Bola Retrô de Couro 1930', preco: 159.90, estoque: 5, img: '/img-vendas/bola_retro.jpg', desc: 'Réplica costurada à mão da primeira bola de Copa.' },
    { id: 3, nome: 'Chuteira do R9 (2002)', preco: 299.90, estoque: 1, img: '/img-vendas/chuteira_r9.jpg', desc: 'Design inspirado no Fenômeno.' },
    { id: 4, nome: 'Medalha Histórica', preco: 79.90, estoque: 8, img: '/img-vendas/Medalha_Historica.jpg', desc: 'Miniatura de metal dourado.' },
  ],
  pessoas: [],
  pedidos: [],
  vendas: [],
  trocas: [],
  chats: {},
  avaliacoes: [],
  favoritos: [],
  notificacoes: [],
}

/* ------------------------------------------------------------------ */
/* Utils de auth                                                       */
/* ------------------------------------------------------------------ */
function sign(usuario) {
  return jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES })
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Token de autenticação ausente.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}

function ok(res, data) {
  res.json(data)
}

/* ------------------------------------------------------------------ */
/* Rotas públicas                                                      */
/* ------------------------------------------------------------------ */
app.get('/api', (req, res) => {
  res.json({ message: 'API Mercado da Copa online ⚽', modo: supabase ? 'supabase' : 'simulado' })
})

// ---- Auth ----
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' })

  if (supabase) {
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase()).single()
    if (error || !data) return res.status(401).json({ error: 'Usuário não encontrado.' })
    const senhaOk = await bcrypt.compare(password, data.senha)
    if (!senhaOk) return res.status(401).json({ error: 'Senha inválida.' })
    return ok(res, { usuario: data, token: sign(data) })
  }

  const u = mem.usuarios.find((x) => x.email === email.toLowerCase())
  if (!u || !bcrypt.compareSync(password, u.senha)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
  }
  return ok(res, { usuario: u, token: sign(u) })
})

app.post('/api/register', async (req, res) => {
  const { nome, email, password } = req.body || {}
  if (!nome || !email || !password) return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' })
  if (!email.includes('@') || password.length < 6) {
    return res.status(400).json({ error: 'E-mail inválido ou senha curta (min. 6 caracteres).' })
  }
  const hash = await bcrypt.hash(password, 8)

  if (supabase) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome_exibicao: nome, email: email.toLowerCase(), senha: hash, avatar_src: '/img-avatares/vini.jpg' }])
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { usuario: data, token: sign(data) })
  }

  if (mem.usuarios.some((u) => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
  }
  const u = { id: mem.usuarios.length + 1, nome_exibicao: nome, email: email.toLowerCase(), senha: hash, avatar_src: '/img-avatares/vini.jpg' }
  mem.usuarios.push(u)
  return ok(res, { usuario: u, token: sign(u) })
})

// ---- Catálogo ----
app.get('/api/produtos', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('produtos').select('*').order('id', { ascending: true })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.produtos)
})

app.get('/api/pessoas', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('pessoas_proximas').select('*')
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.pessoas)
})

/* ------------------------------------------------------------------ */
/* Rotas protegidas                                                    */
/* ------------------------------------------------------------------ */
// ---- Pedidos ----
app.get('/api/pedidos/:cliente', async (req, res) => {
  const cliente = req.params.cliente
  if (supabase) {
    const { data, error } = await supabase.from('pedidos').select('*').eq('cliente', cliente)
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.pedidos.filter((p) => p.cliente === cliente))
})

app.post('/api/pedidos', requireAuth, async (req, res) => {
  const { cliente, pagamento, itens, total, carrinho } = req.body || {}
  const data = formatDateBR()
  const pedido = {
    id: supabase ? null : mem.pedidos.length + 1,
    cliente: cliente || req.user.email,
    status: 'pendente',
    data,
    pagamento: pagamento || 'Pix',
    itens: itens || [],
    total: String(total || 0),
  }

  if (supabase) {
    const { data: created, error } = await supabase.from('pedidos').insert([pedido]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    // reduz estoque de cada item do pedido
    for (const item of carrinho || []) {
      await supabase.rpc('decrementar_estoque', { produto_id: item.id }).catch(() => {})
    }
    return ok(res, { message: 'Pedido criado com sucesso', pedido: created })
  }

  mem.pedidos.push(pedido)
  for (const item of carrinho || []) {
    const p = mem.produtos.find((x) => x.id === item.id)
    if (p) p.estoque = Math.max(0, p.estoque - item.qtd)
  }
  return ok(res, { message: 'Pedido criado com sucesso', pedido })
})

// ---- Perfil ----
app.patch('/api/perfil', requireAuth, async (req, res) => {
  const { nome_exibicao, email } = req.body || {}
  if (supabase) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ nome_exibicao: nome_exibicao, email: email?.toLowerCase() })
      .eq('email', req.user.email)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { usuario: data })
  }
  const u = mem.usuarios.find((x) => x.email === req.user.email)
  if (!u) return res.status(404).json({ error: 'Usuário não encontrado.' })
  if (nome_exibicao) u.nome_exibicao = nome_exibicao
  if (email) u.email = email.toLowerCase()
  return ok(res, { usuario: u })
})

// ---- Vendas ----
app.get('/api/vendas', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('vendas').select('*').order('id', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.vendas)
})

app.post('/api/vendas', requireAuth, async (req, res) => {
  const { nome, preco, estoque, categoria, desc, img } = req.body || {}
  if (!nome || !preco) return res.status(400).json({ error: 'Nome e preço são obrigatórios.' })
  const venda = {
    id: supabase ? null : mem.vendas.length + 1,
    nome,
    preco: Number(preco),
    estoque: Number(estoque || 1),
    categoria: categoria || 'Mercado',
    desc: desc || '',
    img: img || '',
    vendedor: req.user.email,
    data: formatDateBR(),
    vendido: false,
  }
  if (supabase) {
    const { data, error } = await supabase.from('vendas').insert([venda]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { venda: data })
  }
  mem.vendas.push(venda)
  return ok(res, { venda })
})

app.delete('/api/vendas/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (supabase) {
    const { error } = await supabase.from('vendas').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { message: 'Item removido da vitrine.' })
  }
  mem.vendas = mem.vendas.filter((v) => v.id !== id)
  return ok(res, { message: 'Item removido da vitrine.' })
})

// ---- Trocas ----
app.get('/api/trocas', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('propostas_troca').select('*').order('id', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.trocas)
})

app.post('/api/trocas', requireAuth, async (req, res) => {
  const { item_oferecido, item_desejado, desc } = req.body || {}
  if (!item_oferecido || !item_desejado) {
    return res.status(400).json({ error: 'Defina o item oferecido e o desejado.' })
  }
  const proposta = {
    id: supabase ? null : mem.trocas.length + 1,
    item_oferecido,
    item_desejado,
    desc: desc || '',
    de: req.user.email,
    status: 'pendente',
    data: formatDateBR(),
  }
  if (supabase) {
    const { data, error } = await supabase.from('propostas_troca').insert([proposta]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { proposta: data })
  }
  mem.trocas.push(proposta)
  return ok(res, { proposta })
})

app.post('/api/trocas/:id/status', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}
  if (!['aprovada', 'recusada', 'pendente'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' })
  }
  if (supabase) {
    const { data, error } = await supabase
      .from('propostas_troca')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { message: 'Proposta atualizada.', proposta: data })
  }
  const p = mem.trocas.find((x) => x.id === id)
  if (!p) return res.status(404).json({ error: 'Proposta não encontrada.' })
  p.status = status
  return ok(res, { message: 'Proposta atualizada.', proposta: p })
})

// ---- Chat de troca ----
app.get('/api/chats/:propostaId', async (req, res) => {
  const id = Number(req.params.propostaId)
  if (supabase) {
    const { data, error } = await supabase
      .from('chat_troca')
      .select('*')
      .eq('proposta_id', id)
      .order('id', { ascending: true })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.chats[id] || [])
})

app.post('/api/chats/:propostaId', requireAuth, async (req, res) => {
  const id = Number(req.params.propostaId)
  const { texto } = req.body || {}
  if (!texto || !texto.trim()) return res.status(400).json({ error: 'Mensagem vazia.' })
  const mensagem = {
    id: supabase ? null : (mem.chats[id]?.length || 0) + 1,
    proposta_id: id,
    de: req.user.email,
    texto: texto.trim(),
    data: formatTimeBR(),
  }
  if (supabase) {
    const { data, error } = await supabase.from('chat_troca').insert([mensagem]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { mensagem: data })
  }
  mem.chats[id] = [...(mem.chats[id] || []), mensagem]
  return ok(res, { mensagem })
})

// ---- Avaliações ----
app.get('/api/avaliacoes/produto/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (supabase) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('produto_id', id)
      .order('id', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.avaliacoes.filter((a) => a.produtoId === id))
})

app.post('/api/avaliacoes', requireAuth, async (req, res) => {
  const { produtoId, produto, nota, texto } = req.body || {}
  if (!produtoId || !texto || !nota) {
    return res.status(400).json({ error: 'Informe produto, nota e texto.' })
  }
  const avaliacao = {
    id: supabase ? null : mem.avaliacoes.length + 1,
    produto_id: produtoId,
    produto: produto || '',
    nota: Number(nota),
    texto,
    de: req.user.email,
    data: formatDateBR(),
  }
  if (supabase) {
    const { data, error } = await supabase.from('avaliacoes').insert([avaliacao]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { avaliacao: data })
  }
  mem.avaliacoes.push(avaliacao)
  return ok(res, { avaliacao })
})

// ---- Favoritos ----
app.get('/api/favoritos/:email', async (req, res) => {
  const email = req.params.email
  if (supabase) {
    const { data, error } = await supabase
      .from('favoritos')
      .select('produto_id')
      .eq('email', email)
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, (data || []).map((f) => f.produto_id))
  }
  return ok(res, mem.favoritos.filter((f) => f.email === email).map((f) => f.produtoId))
})

app.post('/api/favoritos', requireAuth, async (req, res) => {
  const { produtoId } = req.body || {}
  if (!produtoId) return res.status(400).json({ error: 'Produto ausente.' })
  const existe = mem.favoritos.some((f) => f.email === req.user.email && f.produtoId === produtoId)
  if (existe) {
    mem.favoritos = mem.favoritos.filter((f) => !(f.email === req.user.email && f.produtoId === produtoId))
  } else {
    mem.favoritos.push({ email: req.user.email, produtoId })
  }
  if (supabase) {
    await supabase.from('favoritos').delete().eq('email', req.user.email).eq('produto_id', produtoId)
    if (!existe) {
      await supabase.from('favoritos').insert([{ email: req.user.email, produto_id: produtoId }])
    }
  }
  return ok(res, { favoritos: mem.favoritos.filter((f) => f.email === req.user.email).map((f) => f.produtoId) })
})

// ---- Notificações ----
app.get('/api/notificacoes/:email', async (req, res) => {
  const email = req.params.email
  if (supabase) {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('email', email)
      .order('id', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, data || [])
  }
  return ok(res, mem.notificacoes.filter((n) => n.email === email))
})

app.post('/api/notificacoes', requireAuth, async (req, res) => {
  const { texto, tipo } = req.body || {}
  if (!texto) return res.status(400).json({ error: 'Texto ausente.' })
  const notif = {
    id: supabase ? null : mem.notificacoes.length + 1,
    email: req.user.email,
    texto,
    tipo: tipo || 'sistema',
    lida: false,
    data: formatTimeBR(),
  }
  if (supabase) {
    const { data, error } = await supabase.from('notificacoes').insert([notif]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return ok(res, { notificacao: data })
  }
  mem.notificacoes.push(notif)
  return ok(res, { notificacao: notif })
})

// 404 de rota
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))

module.exports = app

if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, '0.0.0.0', () => {
    console.log(`API Mercado da Copa rodando na porta ${port} (${supabase ? 'Supabase' : 'modo simulado'})`)
  })
}

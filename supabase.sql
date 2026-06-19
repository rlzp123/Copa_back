-- Schema SQL para Supabase (Copie e cole no SQL Editor do Supabase)

-- 1. Criação da Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    img TEXT,
    "desc" TEXT
);

-- 2. Criação da Tabela de Pessoas Próximas (Radar)
CREATE TABLE IF NOT EXISTS public.pessoas_proximas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    distancia TEXT NOT NULL,
    item_interesse TEXT NOT NULL,
    avatar TEXT NOT NULL
);

-- 3. Criação da Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id SERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    data TEXT NOT NULL,
    pagamento TEXT NOT NULL,
    itens TEXT NOT NULL,
    total TEXT NOT NULL
);

-- 4. Criação da Tabela de Usuários (simplificado para auth mockado, caso não use o Auth do Supabase direto)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    nome_exibicao TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    avatar_src TEXT
);

-- ================= INSERTS (MOCK DATA) =================

-- Inserir Produtos Iniciais
INSERT INTO public.produtos (id, nome, preco, estoque, img, "desc") VALUES
(1, 'Camisa Brasil 1970', 300.00, 5, './img-vendas/brasil_1970.webp', 'Camiseta Retro Athleta Pelé 1970 - Amarela'),
(2, 'Casaco Copa 94', 280.00, 2, './img-vendas/casaco_94.jpg', 'Casaco de viagem oficial da comissão técnica e jogadores da seleção tetracampeã nos EUA.'),
(3, 'Boné Canarinho Clássico', 65.00, 15, './img-vendas/bone_canarinho.webp', 'Boné Brasil Canarinho Estampa de Alta Qualidade e Tecido Respirável.'),
(4, 'Chuteira R9 (2002)', 450.00, 1, './img-vendas/chuteira_r9.jpg', 'Chuteira Campo NIKE Mercurial Vapor I FG R9.'),
(5, 'Bola Retrô de Couro 1930', 199.90, 4, './img-vendas/bola_retro.jpg', 'Réplica costurada à mão da primeira bola de Copa do Mundo. Item essencial para colecionadores.'),
(6, 'Camisa Holanda 1974', 320.00, 3, './img-vendas/camisa_holanda.webp', 'O manto da ''Laranja Mecânica'' liderada por Cruyff. Tecido premium com toque esportivo retrô.'),
(7, 'Luva de Goleiro Clássica', 145.00, 8, './img-vendas/luva.webp', 'Inspirada nas grandes defesas dos anos 80, com palma de látex sintético de alta aderência.'),
(8, 'Meião Oficial Amarelo', 45.00, 25, './img-vendas/meia.avif', 'Meião de alta performance com amortecimento anatômico nas zonas de maior impacto.'),
(9, 'Flâmula da Final 1958', 200.00, 10, './img-vendas/flamula.png', 'Flâmula decorativa em cetim celebrando o primeiro título mundial do Brasil na Suécia.'),
(10, 'Agasalho Itália 1982', 410.00, 0, './img-vendas/italia.webp', 'Jaqueta esportiva azul clássica da Azzurra campeã do mundo. [ESGOTADO NO MOMENTO]'),
(12, 'Medalha Comemorativa Ouro', 120.00, 12, './img-vendas/medalha.jpg', 'Réplica detalhada em metal dourado pesado da medalha de campeão mundial da FIFA.'),
(13, 'Camisa Argentina 1986', 360.00, 4, './img-vendas/argentina.webp', 'Manto listrado azul celeste histórico do título eterno de Diego Maradona no México.'),
(14, 'Album Completo - 2014', 1700.00, 7, './img-vendas/album.webp', 'Album Copa 2014 Completo, Para Colar (capa Dura)'),
(15, 'Camisa Alemanha 1990', 340.00, 3, './img-vendas/alemanha.webp', 'Design geométrico icônico da Alemanha Ocidental campeã na Itália. Uma obra de arte.'),
(16, 'Livro Histórico das Copas', 75.00, 9, './img-vendas/historia.webp', 'Enciclopédia ilustrada com todos os dados, fotos e pôsteres desde 1930 até os dias atuais.'),
(17, 'Camisa França 1998', 310.00, 2, './img-vendas/franca.jpeg', 'Modelo com a faixa vermelha no peito usado na primeira conquista francesa liderada por Zidane.'),
(18, 'Bandeira Oficial do Brasil', 55.00, 30, './img-vendas/bandeira.webp', 'Bandeira gigante em poliéster reforçado para apoiar a seleção no estádio ou em casa.'),
(19, 'Ingresso emoldurado 1950', 2550.00, 1, './img-vendas/ingresso.jpg', 'Item de museu: réplica emoldurada do bilhete oficial do Maracanazo da Copa de 50.'),
(20, 'Cachecol Oficial da Copa', 65.00, 18, './img-vendas/cachecol.webp', 'Cachecol de lã dupla face com design comemorativo oficial das eliminatórias mundiais.')
ON CONFLICT (id) DO NOTHING;

-- Reset Sequence para Produtos
SELECT setval('produtos_id_seq', (SELECT MAX(id) FROM produtos));

-- Inserir Pessoas Próximas Iniciais
INSERT INTO public.pessoas_proximas (id, nome, distancia, item_interesse, avatar) VALUES
(101, 'Carlos_Figurinhas', '200m', 'Figurinha Neymar Gold', 'Vini'),
(102, 'Ana_Mantos_94', '500m', 'Casaco Copa 94', 'Neymar'),
(103, 'Pedro_Penta', '1.2km', 'Chuteira R9', 'Endrick'),
(104, 'Marcos_Tri70', '2.5km', 'Camisa Brasil 1970', 'Pelé'),
(105, 'Juliana_Colecionadora', '3.1km', 'Moedas Comemorativas', 'Marta'),
(106, 'Lucas_Hexa26', '4.8km', 'Flâmula de 1958', 'Alisson')
ON CONFLICT (id) DO NOTHING;

-- Reset Sequence para Pessoas Proximas
SELECT setval('pessoas_proximas_id_seq', (SELECT MAX(id) FROM pessoas_proximas));

-- ============================================================
-- Mercado da Copa — Schema SQL para Supabase
-- Copie e cole no SQL Editor do Supabase (novo projeto).
-- ============================================================

-- 1. Produtos (catálogo principal)
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    img TEXT,
    "desc" TEXT
);

-- 2. Pessoas próximas (Radar)
CREATE TABLE IF NOT EXISTS public.pessoas_proximas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    distancia TEXT NOT NULL,
    item_interesse TEXT NOT NULL,
    avatar TEXT NOT NULL
);

-- 3. Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id SERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    data TEXT NOT NULL,
    pagamento TEXT NOT NULL,
    itens TEXT NOT NULL,
    total TEXT NOT NULL
);

-- 4. Usuários (senhas hasheadas com bcrypt)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    nome_exibicao TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    avatar_src TEXT
);

-- 5. Vendas (produtos publicados por usuários)
CREATE TABLE IF NOT EXISTS public.vendas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 1,
    categoria TEXT,
    "desc" TEXT,
    img TEXT,
    vendedor TEXT NOT NULL,
    data TEXT NOT NULL,
    vendido BOOLEAN DEFAULT FALSE
);

-- 6. Propostas de troca
CREATE TABLE IF NOT EXISTS public.propostas_troca (
    id SERIAL PRIMARY KEY,
    item_oferecido TEXT NOT NULL,
    item_desejado TEXT NOT NULL,
    "desc" TEXT,
    "de" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    data TEXT NOT NULL
);

-- 7. Chat de troca
CREATE TABLE IF NOT EXISTS public.chat_troca (
    id SERIAL PRIMARY KEY,
    proposta_id INTEGER NOT NULL REFERENCES public.propostas_troca(id) ON DELETE CASCADE,
    "de" TEXT NOT NULL,
    texto TEXT NOT NULL,
    data TEXT NOT NULL
);

-- 8. Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    produto TEXT,
    nota INTEGER NOT NULL DEFAULT 5,
    texto TEXT NOT NULL,
    "de" TEXT NOT NULL,
    data TEXT NOT NULL
);

-- 9. Favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    produto_id INTEGER NOT NULL,
    UNIQUE (email, produto_id)
);

-- 10. Notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    texto TEXT NOT NULL,
    tipo TEXT DEFAULT 'sistema',
    lida BOOLEAN DEFAULT FALSE,
    data TEXT NOT NULL
);

-- Função: reduz o estoque de um produto (usada no POST /api/pedidos)
CREATE OR REPLACE FUNCTION public.decrementar_estoque(produto_id INT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.produtos
    SET estoque = GREATEST(estoque - 1, 0)
    WHERE id = produto_id;
END;
$$;

-- ============================================================
-- INSERTS (MOCK DATA)
-- ============================================================

INSERT INTO public.produtos (id, nome, preco, estoque, img, "desc") VALUES
(1, 'Camisa Brasil 1970', 300.00, 5, '/img-vendas/camisa_1970_Brasil.jpg', 'Camiseta Retro Athleta Pelé 1970 - Amarela'),
(2, 'Casaco Copa 94', 280.00, 2, '/img-vendas/casaco_94.jpg', 'Casaco de viagem da seleção tetracampeã nos EUA.'),
(3, 'Boné Canarinho Clássico', 65.00, 15, '/img-vendas/bone_canarinho.webp', 'Boné Brasil Canarinho de alta qualidade.'),
(4, 'Chuteira R9 (2002)', 450.00, 1, '/img-vendas/chuteira_r9.jpg', 'Chuteira Campo NIKE Mercurial Vapor I FG R9.'),
(5, 'Bola Retrô de Couro 1930', 199.90, 4, '/img-vendas/bola_retro.jpg', 'Réplica costurada à mão da primeira bola de Copa.'),
(6, 'Camisa Holanda 1974', 320.00, 3, '/img-vendas/camisa_holanda.webp', 'O manto da Laranja Mecânica liderado por Cruyff.'),
(7, 'Luva de Goleiro Clássica', 145.00, 8, '/img-vendas/luva.webp', 'Palma de látex sintético de alta aderência.'),
(8, 'Meião Oficial Amarelo', 45.00, 25, '/img-vendas/meia.avif', 'Meião de alta performance com amortecimento.'),
(9, 'Flâmula da Final 1958', 200.00, 10, '/img-vendas/flamula.png', 'Flâmula em cetim do primeiro título mundial do Brasil.'),
(10, 'Agasalho Itália 1982', 410.00, 0, '/img-vendas/italia.webp', 'Jaqueta esportiva azul clássica da Azzurra.'),
(12, 'Medalha Comemorativa Ouro', 120.00, 12, '/img-vendas/medalha.jpg', 'Réplica em metal dourado da medalha de campeão.'),
(13, 'Camisa Argentina 1986', 360.00, 4, '/img-vendas/argentina.webp', 'Manto listrado do título eterno de Maradona.'),
(14, 'Album Completo - 2014', 1700.00, 7, '/img-vendas/album.webp', 'Álbum Copa 2014 Completo, para colar (capa dura)'),
(15, 'Camisa Alemanha 1990', 340.00, 3, '/img-vendas/alemanha.webp', 'Design geométrico icônico da Alemanha Ocidental.'),
(16, 'Livro Histórico das Copas', 75.00, 9, '/img-vendas/historia.webp', 'Enciclopédia ilustrada de todas as Copas desde 1930.'),
(17, 'Camisa França 1998', 310.00, 2, '/img-vendas/franca.jpeg', 'Faixa vermelha no peito da primeira conquista francesa.'),
(18, 'Bandeira Oficial do Brasil', 55.00, 30, '/img-vendas/bandeira.webp', 'Bandeira gigante em poliéster reforçado.'),
(19, 'Ingresso emoldurado 1950', 2550.00, 1, '/img-vendas/ingresso.jpg', 'Réplica emoldurada do bilhete do Maracanazo.'),
(20, 'Cachecol Oficial da Copa', 65.00, 18, '/img-vendas/cachecol.webp', 'Cachecol de lã dupla face comemorativo.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('produtos_id_seq', (SELECT MAX(id) FROM produtos));

INSERT INTO public.pessoas_proximas (id, nome, distancia, item_interesse, avatar) VALUES
(101, 'Carlos_Figurinhas', '200m', 'Figurinha Neymar Gold', '/img-avatares/vini.jpg'),
(102, 'Ana_Mantos_94', '500m', 'Casaco Copa 94', '/img-avatares/neymar.jpg'),
(103, 'Pedro_Penta', '1.2km', 'Chuteira R9', '/img-avatares/endrick.jpg'),
(104, 'Marcos_Tri70', '2.5km', 'Camisa Brasil 1970', '/img-avatares/alisson.jpg'),
(105, 'Juliana_Colecionadora', '3.1km', 'Moedas Comemorativas', '/img-avatares/paquetá.jpg'),
(106, 'Lucas_Hexa26', '4.8km', 'Flâmula de 1958', '/img-avatares/danilo.avif')
ON CONFLICT (id) DO NOTHING;

SELECT setval('pessoas_proximas_id_seq', (SELECT MAX(id) FROM pessoas_proximas));

-- Usuário demo (senha: 123456, hash bcrypt já gerado)
INSERT INTO public.usuarios (nome_exibicao, email, senha, avatar_src)
VALUES ('Torcedor Demo', 'demo@copa.com', '$2a$08$MKDhjGtyJczGvfd.7u4GBuSXJWpZm5Ztyv/EvbhDYrk9vSMCMhAR2', '/img-avatares/vini.jpg')
ON CONFLICT (email) DO NOTHING;

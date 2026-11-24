# Mercado da Copa — Backend

API Express + Supabase para o Mercado da Copa. Autenticação com **JWT**, senhas **hasheadas (bcrypt)** e endpoints completos: catálogo, pedidos, vendas, trocas, chat, avaliações, favoritos e notificações.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha os valores de Supabase
npm start              # http://localhost:3000
```

**Modo simulado:** se você não definir `SUPABASE_URL` / `SUPABASE_ANON_KEY`, a API roda em modo simulado com dados em memória — perfeito para testar o front sem configurar banco.

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, cole todo o conteúdo de `supabase.sql` (cria as tabelas, a função `decrementar_estoque` e os dados iniciais).
3. Cole as chaves no `.env`:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon public key
4. **Importante:** em Projeto > **API**, adicione a tabela `usuarios` com permissão de leitura/escrita para "Authenticated" (ou use RLS conforme sua necessidade), senão o login/registro não funciona.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/login` | Login `{ email, password }` → `{ usuario, token }` |
| POST | `/api/register` | Registro `{ nome, email, password }` |
| GET | `/api/produtos` | Catálogo de produtos |
| GET | `/api/pessoas` | Pessoas próximas (radar) |
| GET | `/api/pedidos/:cliente` | Pedidos de um cliente |
| POST | `/api/pedidos` | Criar pedido (atualiza estoque) |
| PATCH | `/api/perfil` | Atualizar perfil (autenticado) |
| GET | `/api/vendas` | Produtos à venda |
| POST | `/api/vendas` | Publicar produto (autenticado) |
| DELETE | `/api/vendas/:id` | Remover (autenticado) |
| GET | `/api/trocas` | Propostas de troca |
| POST | `/api/trocas` | Criar proposta (autenticado) |
| POST | `/api/trocas/:id/status` | Aprovar/recusar (autenticado) |
| GET | `/api/chats/:propostaId` | Mensagens da troca |
| POST | `/api/chats/:propostaId` | Enviar mensagem (autenticado) |
| GET | `/api/avaliacoes/produto/:id` | Avaliações do produto |
| POST | `/api/avaliacoes` | Criar avaliação (autenticado) |
| GET | `/api/favoritos/:email` | Favoritos do usuário |
| POST | `/api/favoritos` | Alternar favorito (autenticado) |
| GET | `/api/notificacoes/:email` | Notificações |
| POST | `/api/notificacoes` | Criar notificação (autenticado) |

## Deploy (Vercel)

- Importe este repositório no Vercel.
- Em Settings > Environment Variables, adicione `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `JWT_SECRET`.
- O `vercel.json` já mapeia `/(.*)` para `api/index.js` (serverless Node).

# RAV Obras — Site (2 Landing Pages)

Iniciado em: 2026-08-10
Cliente: Rav Obras Ltda (CNPJ 07.666.573-0001/06)
Contato comercial: Vittor Rodrigues — WhatsApp (11) 94701-8958

## Escopo
Duas landing pages independentes, alto nível de consciência (tráfego Google Search):
1. **LP Obras Comerciais** — obra comercial completa (turnkey), do projeto à entrega da chave.
2. **LP Reformas Comerciais** — reforma comercial focada em drywall, pisos (vinílico/laminado) e acabamentos, sem parar a operação do cliente.

CTA padrão das duas: botão "Solicitar orçamento" → WhatsApp (11) 94701-8958.

## Inventário do material
- `Marca/`: 3 arquivos — MIV (PDF, 17 páginas) + 2 versões do logotipo "RAV" extraídas do MIV (fundo claro e fundo escuro, PNG transparente). Marca é só wordmark, sem ícone/monograma dedicado.
- `Copys/`: 7 arquivos — as 2 copies finais das LPs (`RAV_Obras_Copy.md`, `RAV_Reformas_Copy.md`, já estruturadas por seção), + institucional, briefing/estratégia, transcrição da reunião de kickoff, planilhas de aprofundamento e leads (contexto, não vão para o site).
- `imagens/originais_obras/`: 407 arquivos (291 jpg, 61 heic, 38 mp4, 13 png, 4 mov) — fotos e vídeos reais de obras/reformas executadas. Curadoria para portfólio/hero na etapa 6.
- Pendente em `_raw/`: nenhum (só sobraram as pastas vazias + cópias duplicadas das copies, já replicadas em `Copys/`).

## Identidade visual (extraída do MIV)
- **Paleta:** `#B59975` (dourado/bronze — cor de destaque), `#D3C095` (dourado claro), `#18181B` (quase preto), `#F4F4F5` (quase branco). Inalterada nas 2 revisões de design.
- **Tipografia:** ~~Poppins~~ → **Montserrat + Inter** (revisão "Premium+" pedida pelo
  cliente na etapa 8 — ver `brief-pack.md` §8, mantida na revisão v2 — ver §9).
  Montserrat 600/700/800 em headlines/overlines/números/CTAs; Inter 400/500/600
  em corpo/nav/formulários.
- **Logotipo:** wordmark "RAV" (R em cinza/prata + AV em dourado sobre fundo escuro; R em preto + AV em dourado sobre fundo claro). Sem ícone separado — usar o wordmark também como base do favicon.
- **Redesign v2 (ago/2026):** cliente rejeitou a direção visual da revisão "Premium+" e pediu uma proposta genuinamente diferente ("não aproveite nada do design atual, precisamos de outra proposta"). Composição reconstruída do zero (nova referência macro, novos padrões de design-bank por seção, predominância clara→escura invertida), mantendo paleta/tipografia/copy/imagens. Detalhes completos em `brief-pack.md` §9.

## Estrutura de deploy (2 pastas independentes)
Cada LP virou uma pasta de deploy autocontida (CSS/JS/imagens/páginas institucionais/backend PHP
próprios, sem depender da outra pasta):
- `deploy-obras/` — LP Obras Comerciais (`index.html` = home)
- `deploy-reformas/` — LP Reformas Comerciais (`index.html` = home)

**Premissa assumida para os links cruzados** (menu, rodapé, logo): as duas pastas serão publicadas
como **pastas-irmãs sob o mesmo domínio** — ex. `ravobras.com.br/` (conteúdo de `deploy-obras/`) e
`ravobras.com.br/reformas/` (conteúdo de `deploy-reformas/`, renomeada para `reformas/` no
servidor). Os links internos (`../reformas/`, `../obras/`) só funcionam se essa renomeação for
respeitada no upload — **se a hospedagem final for outra (subdomínios separados, domínios
diferentes, ou nomes de pasta diferentes), esses links precisam ser reajustados antes do deploy**.

## Pendências que dependem do usuário
- Hospedagem final (Vercel vs Hostinger/WordPress) e a topologia exata das 2 pastas (ver acima) — usando HTML estático + pastas-irmãs como default até decisão.
- GTM/GA4/Meta Pixel/Google Ads IDs — não fornecidos, módulos de tag pulados (o cookie consent já dispara `dataLayer`, pronto para quando o GTM entrar).
- Domínio final das 2 LPs — canonical usa `www.ravobras.com.br` (Obras) e `www.ravobras.com.br/reformas/` (Reformas) como placeholder.
- Confirmação do WhatsApp (11) 94701-8958 como número oficial de conversão (aparece também um número alternativo 11 94791-3486 no PDF institucional — sinalizado para reconciliação do cliente).
- E-mail de contato oficial (usado `contato@ravobras.com.br` como placeholder no backend/política de privacidade).
- Backend PHP (`form-handler.php`/`admin.php`/`db-config.example.php`) instalado em cada pasta de deploy mas não configurado — falta host/banco/usuário/senha reais (criar `db-config.php` real direto no servidor, nunca versionar) e nova senha de admin antes do deploy. Como são 2 pastas, isso é necessário 2x (uma config por LP) — ou apontar as duas para o mesmo banco com prefixos diferentes (`rav_obras_*` já é o prefixo usado).
- 3 fotos brutas corrompidas no download do Drive (0 bytes) — ver `imagens/tratadas/MANIFESTO.md`.

## Checklist do pipeline
- [x] 1. Material extraído do Drive
- [x] 2. Pastas organizadas (scaffold-projeto) + logo extraída do MIV
- [x] 2b. Repositório GitHub criado
- [x] 3. Design system (skill: design-system)
- [x] 4. Copy das 2 LPs estruturada para o front-end (skill: extrair-copy)
- [x] 5. Front-end das 2 LPs criado (skill: gerar-frontend) — `Site/index.html` (Obras) +
      `Site/reformas.html` (Reformas), CSS/JS compartilhados, auditado via
      `revisar-frontend` (0 achados bloqueantes ao final; ver `brief-pack.md` §7).
      Redesenhado 2x durante a revisão humana (etapa 8): revisão "Premium+"
      (tipografia, ver §8) e depois redesign completo v2 (nova composição/UI,
      ver §9) — funcionalidades e conteúdo preservados em ambas.
- [x] 6. Ajustes finais — imagens em `.webp`, responsivo 320–1280px sem overflow, menu
      mobile/lightbox/FAQ/tabela comparativa testados funcionalmente
- [x] 7. Módulos LGPD instalados — banner de cookies (dispara `dataLayer`), modal de
      Política de Privacidade, páginas `Site/fornecedores/` e `Site/trabalhe-conosco/`,
      backend PHP (`form-handler.php`/`admin.php`/`db-config.php`, não configurado).
      Tags de analytics (GTM/GA4/Pixel/Ads) puladas — sem IDs do cliente.
- [x] 8. Revisão humana — **aprovado pelo cliente** ("o design ficou bom agora"), após
      2 rodadas de redesign + ajustes finos de proporção/WCAG. Projeto final organizado
      em 2 pastas de deploy independentes (`deploy-obras/`, `deploy-reformas/`).
- [ ] 9. 🛑 Deploy — aguarda hospedagem/domínio/secrets (ver pendências acima)

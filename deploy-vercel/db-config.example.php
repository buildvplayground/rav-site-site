<?php
// ══════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO — RAV Obras — preencha antes de subir no servidor
//  Encontre as credenciais em: cPanel > MySQL Databases
//  NUNCA versione este arquivo com credenciais reais (ver .gitignore).
// ══════════════════════════════════════════════════════════════

// Prefixo do projeto (evita conflito com outros projetos/plugins no mesmo banco)
define('PROJETO_PREFIX', 'rav_obras');   // usado nos nomes das tabelas (rav_obras_candidatos, rav_obras_fornecedores)

if (!defined('PROJETO_DB_HOST'))     define('PROJETO_DB_HOST',     'localhost');
if (!defined('PROJETO_DB_NAME'))     define('PROJETO_DB_NAME',     'DEFINIR_NOME_DO_BANCO');      // ex: u123456_ravobras
if (!defined('PROJETO_DB_USER'))     define('PROJETO_DB_USER',     'DEFINIR_USUARIO_DO_BANCO');   // ex: u123456_admin
if (!defined('PROJETO_DB_PASSWORD')) define('PROJETO_DB_PASSWORD', 'DEFINIR_SENHA_DO_BANCO');

// E-mail que recebe notificação a cada novo envio (candidatura ou fornecedor)
// Placeholder — o cliente ainda não definiu o e-mail de contato oficial.
if (!defined('PROJETO_NOTIFY'))      define('PROJETO_NOTIFY',      'contato@ravobras.com.br');

// Senha do painel admin (acesse /admin.php) — TROCAR antes de subir ao servidor
if (!defined('PROJETO_ADMIN_PASS'))  define('PROJETO_ADMIN_PASS',  'DEFINIR_SENHA_FORTE_AQUI');

// Pasta e URL para uploads de arquivos (currículos, propostas etc.)
if (!defined('PROJETO_UPLOAD_DIR'))  define('PROJETO_UPLOAD_DIR',  __DIR__ . '/uploads/arquivos/');
if (!defined('PROJETO_UPLOAD_URL'))  define('PROJETO_UPLOAD_URL',  '/uploads/arquivos/');

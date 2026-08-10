<?php
// ══════════════════════════════════════════════════════════════
//  PAINEL ADMIN — RAV Obras — visualização dos leads recebidos
//  Acesso: www.ravobras.com.br/admin.php
//  Senha configurada em db-config.php (PROJETO_ADMIN_PASS)
// ══════════════════════════════════════════════════════════════

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/db-config.php';

$error = '';

if (isset($_POST['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

if (isset($_POST['senha'])) {
    if ($_POST['senha'] === PROJETO_ADMIN_PASS) {
        $_SESSION['proj_admin'] = true;
    } else {
        $error = 'Senha incorreta.';
    }
}

$logado = !empty($_SESSION['proj_admin']);

$candidatos   = [];
$fornecedores = [];

if ($logado) {
    $conn = new mysqli(PROJETO_DB_HOST, PROJETO_DB_USER, PROJETO_DB_PASSWORD, PROJETO_DB_NAME);
    $conn->set_charset('utf8mb4');

    $tab_c = PROJETO_PREFIX . '_candidatos';
    $tab_f = PROJETO_PREFIX . '_fornecedores';

    // Cria tabelas se ainda não existirem
    $conn->query("CREATE TABLE IF NOT EXISTS {$tab_c} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        area VARCHAR(255) NOT NULL, nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL, telefone VARCHAR(50) NOT NULL,
        arquivo VARCHAR(255) DEFAULT '', data_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS {$tab_f} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        produto VARCHAR(255) NOT NULL, nome VARCHAR(255) NOT NULL,
        empresa VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,
        telefone VARCHAR(50) NOT NULL, arquivo VARCHAR(255) DEFAULT '',
        data_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $r = $conn->query("SELECT * FROM {$tab_c} ORDER BY data_envio DESC");
    if ($r) while ($row = $r->fetch_assoc()) $candidatos[] = $row;

    $r = $conn->query("SELECT * FROM {$tab_f} ORDER BY data_envio DESC");
    if ($r) while ($row = $r->fetch_assoc()) $fornecedores[] = $row;

    $conn->close();
}

$aba = $_GET['aba'] ?? 'candidatos';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Painel Admin — RAV Obras</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #18181B; --paper: #F4F4F5; --card: #ffffff;
      --line: #E3E3E5; --muted: #71717A; --gold: #B59975;
      --font-display: 'Montserrat', sans-serif; --font-body: 'Inter', sans-serif;
    }
    body { font-family: var(--font-body); background: var(--paper); color: var(--ink); font-size: 14px; min-height: 100vh; }
    h1, h2, h3 { font-family: var(--font-display); }

    /* Login */
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .login-box { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 40px; width: 100%; max-width: 380px; }
    .login-box h1 { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
    .login-box p { color: var(--muted); margin-bottom: 28px; font-size: 13px; }
    .login-box label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: 6px; }
    .login-box input[type="password"] { width: 100%; padding: 11px 14px; border: 1px solid var(--line); border-radius: 5px; font-family: inherit; font-size: 14px; background: var(--paper); }
    .login-box input:focus { outline: none; border-color: var(--gold); }
    .login-box button { width: 100%; margin-top: 16px; padding: 12px; background: var(--ink); color: #fff; border: none; border-radius: 5px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
    .login-error { margin-top: 12px; padding: 10px 14px; background: #fdf2f2; border: 1px solid #e8b4b4; border-radius: 4px; color: #8a2020; font-size: 13px; }

    /* Painel */
    header { background: var(--ink); color: #fff; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    header .brand { font-family: var(--font-display); font-weight: 700; font-size: 15px; }
    header form button { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: #fff; padding: 6px 14px; border-radius: 4px; font-family: inherit; font-size: 12px; cursor: pointer; }
    .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat { background: var(--card); border: 1px solid var(--line); border-radius: 7px; padding: 20px 22px; }
    .stat .num { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1; }
    .stat .lbl { font-size: 12px; color: var(--muted); margin-top: 4px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 24px; }
    .tab { padding: 8px 20px; border-radius: 5px; font-size: 13px; font-weight: 500; text-decoration: none; color: var(--muted); border: 1px solid transparent; }
    .tab:hover { color: var(--ink); background: var(--card); border-color: var(--line); }
    .tab.active { background: var(--ink); color: #fff; }
    .tab-badge { display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.25); color: #fff; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px; margin-left: 6px; }
    .tab:not(.active) .tab-badge { background: var(--line); color: var(--muted); }
    .table-wrap { background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    .table-head { padding: 16px 20px; border-bottom: 1px solid var(--line); font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--paper); }
    td { padding: 13px 16px; border-bottom: 1px solid var(--line); vertical-align: middle; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafaf8; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--paper); border: 1px solid var(--line); }
    .file-link { display: inline-flex; align-items: center; gap: 5px; color: var(--ink); font-size: 12px; font-weight: 500; text-decoration: none; padding: 4px 10px; border: 1px solid var(--line); border-radius: 4px; }
    .empty { padding: 48px; text-align: center; color: var(--muted); }
  </style>
</head>
<body>

<?php if (!$logado): ?>
<div class="login-wrap">
  <div class="login-box">
    <h1>Painel Admin — RAV Obras</h1>
    <p>Acesso restrito — insira a senha para continuar.</p>
    <form method="POST">
      <label for="senha">Senha</label>
      <input type="password" id="senha" name="senha" autofocus autocomplete="current-password">
      <button type="submit">Entrar</button>
      <?php if ($error): ?>
        <div class="login-error"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>
    </form>
  </div>
</div>

<?php else: ?>
<header>
  <div class="brand">RAV Obras — Painel Administrativo</div>
  <form method="POST"><button type="submit" name="logout">Sair</button></form>
</header>

<div class="container">
  <div class="stats">
    <div class="stat">
      <div class="num"><?= count($candidatos) ?></div>
      <div class="lbl">Candidaturas recebidas</div>
    </div>
    <div class="stat">
      <div class="num"><?= count($fornecedores) ?></div>
      <div class="lbl">Fornecedores cadastrados</div>
    </div>
  </div>

  <div class="tabs">
    <a href="?aba=candidatos" class="tab <?= $aba === 'candidatos' ? 'active' : '' ?>">
      Candidaturas <span class="tab-badge"><?= count($candidatos) ?></span>
    </a>
    <a href="?aba=fornecedores" class="tab <?= $aba === 'fornecedores' ? 'active' : '' ?>">
      Fornecedores <span class="tab-badge"><?= count($fornecedores) ?></span>
    </a>
  </div>

  <?php if ($aba === 'candidatos'): ?>
  <div class="table-wrap">
    <div class="table-head">Candidaturas — Trabalhe Conosco</div>
    <?php if (empty($candidatos)): ?>
      <div class="empty">Nenhuma candidatura recebida ainda.</div>
    <?php else: ?>
    <table>
      <thead><tr><th>#</th><th>Data</th><th>Nome</th><th>Área</th><th>E-mail</th><th>Telefone</th><th>Arquivo</th></tr></thead>
      <tbody>
        <?php foreach ($candidatos as $r): ?>
        <tr>
          <td style="color:var(--muted)"><?= $r['id'] ?></td>
          <td style="white-space:nowrap"><?= date('d/m/Y H:i', strtotime($r['data_envio'])) ?></td>
          <td><strong><?= htmlspecialchars($r['nome']) ?></strong></td>
          <td><span class="badge"><?= htmlspecialchars($r['area']) ?></span></td>
          <td><a href="mailto:<?= htmlspecialchars($r['email']) ?>" style="color:var(--ink)"><?= htmlspecialchars($r['email']) ?></a></td>
          <td><?= htmlspecialchars($r['telefone']) ?></td>
          <td><?php if ($r['arquivo']): ?><a class="file-link" href="<?= PROJETO_UPLOAD_URL . htmlspecialchars($r['arquivo']) ?>" target="_blank">↓ Baixar</a><?php else: ?><span style="color:var(--muted)">—</span><?php endif; ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>

  <?php else: ?>
  <div class="table-wrap">
    <div class="table-head">Fornecedores Cadastrados</div>
    <?php if (empty($fornecedores)): ?>
      <div class="empty">Nenhum fornecedor cadastrado ainda.</div>
    <?php else: ?>
    <table>
      <thead><tr><th>#</th><th>Data</th><th>Nome</th><th>Empresa</th><th>Produto / Serviço</th><th>E-mail</th><th>Telefone</th><th>Arquivo</th></tr></thead>
      <tbody>
        <?php foreach ($fornecedores as $r): ?>
        <tr>
          <td style="color:var(--muted)"><?= $r['id'] ?></td>
          <td style="white-space:nowrap"><?= date('d/m/Y H:i', strtotime($r['data_envio'])) ?></td>
          <td><strong><?= htmlspecialchars($r['nome']) ?></strong></td>
          <td><?= htmlspecialchars($r['empresa']) ?></td>
          <td><span class="badge"><?= htmlspecialchars($r['produto']) ?></span></td>
          <td><a href="mailto:<?= htmlspecialchars($r['email']) ?>" style="color:var(--ink)"><?= htmlspecialchars($r['email']) ?></a></td>
          <td><?= htmlspecialchars($r['telefone']) ?></td>
          <td><?php if ($r['arquivo']): ?><a class="file-link" href="<?= PROJETO_UPLOAD_URL . htmlspecialchars($r['arquivo']) ?>" target="_blank">↓ Baixar</a><?php else: ?><span style="color:var(--muted)">—</span><?php endif; ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>
  <?php endif; ?>
</div>
<?php endif; ?>
</body>
</html>

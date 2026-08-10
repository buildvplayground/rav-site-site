<?php
// ══════════════════════════════════════════════════════════════
//  HANDLER DE FORMULÁRIOS — RAV Obras
//  Recebe os POSTs via fetch() do front-end (fornecedores/ e trabalhe-conosco/)
//  Suporta múltiplos tipos de form via campo oculto "form_type"
// ══════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db-config.php';

$form_type = $_POST['form_type'] ?? '';

// ── Roteamento ────────────────────────────────────────────────
if ($form_type === 'candidato') {
    handle_candidato();
} elseif ($form_type === 'fornecedor') {
    handle_fornecedor();
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formulário inválido.']);
    exit;
}

// ════════════════════════════════════════════════════════════
//  FORM 1 — TRABALHE CONOSCO / CANDIDATOS
//  Campos: area, nome, email, telefone + arquivo opcional
// ════════════════════════════════════════════════════════════
function handle_candidato() {
    $area     = trim($_POST['area']     ?? '');
    $nome     = trim($_POST['nome']     ?? '');
    $email    = trim($_POST['email']    ?? '');
    $telefone = trim($_POST['telefone'] ?? '');

    if (!$area || !$nome || !$email || !$telefone) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'E-mail inválido.']);
        exit;
    }

    $arquivo = upload_arquivo();

    $conn = db_connect();
    $tabela = PROJETO_PREFIX . '_candidatos';
    $conn->query("CREATE TABLE IF NOT EXISTS {$tabela} (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        area       VARCHAR(255) NOT NULL,
        nome       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        telefone   VARCHAR(50)  NOT NULL,
        arquivo    VARCHAR(255) DEFAULT '',
        data_envio DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $conn->prepare(
        "INSERT INTO {$tabela} (area, nome, email, telefone, arquivo) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('sssss', $area, $nome, $email, $telefone, $arquivo);
    db_execute($stmt);
    $conn->close();

    $corpo = "Nova candidatura recebida — RAV Obras.\n\n"
           . "Nome:     {$nome}\n"
           . "E-mail:   {$email}\n"
           . "Telefone: {$telefone}\n"
           . "Área:     {$area}\n"
           . ($arquivo ? "Arquivo:  " . PROJETO_UPLOAD_URL . $arquivo . "\n" : "Arquivo:  não enviado\n")
           . "\nData: " . date('d/m/Y H:i');

    send_email("Nova candidatura — {$area}", $corpo, $email);
    echo json_encode(['success' => true]);
}

// ════════════════════════════════════════════════════════════
//  FORM 2 — FORNECEDORES
//  Campos: produto, nome, empresa, email, telefone + arquivo opcional
// ════════════════════════════════════════════════════════════
function handle_fornecedor() {
    $produto  = trim($_POST['produto']  ?? '');
    $nome     = trim($_POST['nome']     ?? '');
    $empresa  = trim($_POST['empresa']  ?? '');
    $email    = trim($_POST['email']    ?? '');
    $telefone = trim($_POST['telefone'] ?? '');

    if (!$produto || !$nome || !$empresa || !$email || !$telefone) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'E-mail inválido.']);
        exit;
    }

    $arquivo = upload_arquivo();

    $conn = db_connect();
    $tabela = PROJETO_PREFIX . '_fornecedores';
    $conn->query("CREATE TABLE IF NOT EXISTS {$tabela} (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        produto    VARCHAR(255) NOT NULL,
        nome       VARCHAR(255) NOT NULL,
        empresa    VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        telefone   VARCHAR(50)  NOT NULL,
        arquivo    VARCHAR(255) DEFAULT '',
        data_envio DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $conn->prepare(
        "INSERT INTO {$tabela} (produto, nome, empresa, email, telefone, arquivo) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('ssssss', $produto, $nome, $empresa, $email, $telefone, $arquivo);
    db_execute($stmt);
    $conn->close();

    $corpo = "Novo fornecedor cadastrado — RAV Obras.\n\n"
           . "Produto/Serviço: {$produto}\n"
           . "Nome:            {$nome}\n"
           . "Empresa:         {$empresa}\n"
           . "E-mail:          {$email}\n"
           . "Telefone:        {$telefone}\n"
           . ($arquivo ? "Arquivo:         " . PROJETO_UPLOAD_URL . $arquivo . "\n" : "Arquivo:         não enviado\n")
           . "\nData: " . date('d/m/Y H:i');

    send_email("Novo fornecedor — {$empresa}", $corpo, $email);
    echo json_encode(['success' => true]);
}

// ════════════════════════════════════════════════════════════
//  HELPERS — não alterar
// ════════════════════════════════════════════════════════════
function db_connect() {
    $conn = new mysqli(PROJETO_DB_HOST, PROJETO_DB_USER, PROJETO_DB_PASSWORD, PROJETO_DB_NAME);
    $conn->set_charset('utf8mb4');
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro interno. Tente novamente.']);
        exit;
    }
    return $conn;
}

function db_execute($stmt) {
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar. Tente novamente.']);
        exit;
    }
    $stmt->close();
}

function upload_arquivo() {
    if (!isset($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
        return '';
    }
    $allowed = ['pdf', 'doc', 'docx'];
    $ext     = strtolower(pathinfo($_FILES['arquivo']['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Formato inválido. Use PDF, DOC ou DOCX.']);
        exit;
    }
    if ($_FILES['arquivo']['size'] > 5 * 1024 * 1024) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Arquivo muito grande. Máximo 5 MB.']);
        exit;
    }

    if (!is_dir(PROJETO_UPLOAD_DIR)) {
        mkdir(PROJETO_UPLOAD_DIR, 0755, true);
        // Bloqueia execução de PHP na pasta de uploads
        file_put_contents(
            dirname(PROJETO_UPLOAD_DIR) . '/.htaccess',
            "Options -Indexes\n<FilesMatch '\\.(php|php5|phtml)$'>\n  Deny from all\n</FilesMatch>\n"
        );
    }

    $nome_arquivo = uniqid() . '_' . preg_replace('/[^a-z0-9_.-]/i', '', $_FILES['arquivo']['name']);
    move_uploaded_file($_FILES['arquivo']['tmp_name'], PROJETO_UPLOAD_DIR . $nome_arquivo);
    return $nome_arquivo;
}

function send_email($assunto, $corpo, $reply_to) {
    $headers = "From: noreply@ravobras.com.br\r\n"
             . "Reply-To: {$reply_to}\r\n"
             . "X-Mailer: PHP/" . phpversion();
    mail(PROJETO_NOTIFY, $assunto, $corpo, $headers);
}

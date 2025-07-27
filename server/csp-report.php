<?php
// BLOCK ALL NON-POST METHODS
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // METHOD NOT ALLOWED
    header('Allow: POST'); // INFORM WHICH METHODS ARE ALLOWED
    exit;
}

// GET RAW POST DATA
$rawReport = file_get_contents('php://input');

// VALIDATE JSON
$json = json_decode($rawReport, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // BAD REQUEST
    echo json_encode(['error' => 'Invalid JSON']); // SEND ERROR MESSAGE
    exit;
}

// TIMESTAMP
$timestamp = gmdate('Y-m-d H:i:s');

// CLIENT INFO
$ip        = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$hostname  = gethostbyaddr($ip) ?: 'unresolved';
$agent     = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$referer   = $_SERVER['HTTP_REFERER'] ?? 'unknown';
$origin    = $_SERVER['HTTP_ORIGIN'] ?? 'unknown';
$method    = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$uri       = $_SERVER['REQUEST_URI'] ?? 'unknown';

// CSP REPORT DATA
$reportData = $json['csp-report'] ?? [];

// PREPARE LOG ENTRY
$logEntry = [
    'timestamp'           => $timestamp,
    'ip'                  => $ip,
    'hostname'            => $hostname,
    'user_agent'          => mb_substr($agent, 0, 512),
    'referer'             => mb_substr($referer, 0, 512),
    'origin'              => mb_substr($origin, 0, 512),
    'method'              => $method,
    'uri'                 => $uri,
    'document_uri'        => $reportData['document-uri'] ?? 'unknown',
    'blocked_uri'         => $reportData['blocked-uri'] ?? 'unknown',
    'violated_directive'  => $reportData['violated-directive'] ?? 'unknown',
    'effective_directive' => $reportData['effective-directive'] ?? 'unknown',
    'original_policy'     => $reportData['original-policy'] ?? 'unknown',
    'source_file'         => $reportData['source-file'] ?? 'unknown',
    'line_number'         => $reportData['line-number'] ?? '-',
    'column_number'       => $reportData['column-number'] ?? '-',
    'status_code'         => $reportData['status-code'] ?? 'unknown',
    'script_sample'       => mb_substr($reportData['script-sample'] ?? '', 0, 200),
];

// SET LOG FILE PATH
$logDir = __DIR__ . '/logs';
$logFile = $logDir . '/csp.jsonl';

// CREATE LOG DIR IF NOT EXISTS
if (!is_dir($logDir) && !mkdir($logDir, 0755, true) && !is_dir($logDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create log directory']); // SEND ERROR MESSAGE
    exit;
}

// APPEND LOG AS JSON LINE
if (file_put_contents($logFile, json_encode($logEntry, JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write log']); // SEND ERROR MESSAGE
    exit;
}

// SEND SUCCESS RESPONSE
http_response_code(204);
exit;
?>
<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION = [];
session_destroy();

echo json_encode(['success' => true, 'message' => 'Դուք դուրս եկաք հաշվից'], JSON_UNESCAPED_UNICODE);
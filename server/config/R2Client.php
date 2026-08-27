<?php
require_once __DIR__ . '/r2.php';

class R2Client {
    private $accountId;
    private $accessKey;
    private $secretKey;
    private $bucketName;
    private $endpoint;
    private $publicUrl;
    private $region;

    public function __construct() {
        $this->accountId = R2_ACCOUNT_ID;
        $this->accessKey = R2_ACCESS_KEY_ID;
        $this->secretKey = R2_SECRET_ACCESS_KEY;
        $this->bucketName = R2_BUCKET_NAME;
        $this->endpoint = rtrim(R2_ENDPOINT, '/');
        $this->publicUrl = rtrim(R2_PUBLIC_URL, '/');
        $this->region = R2_REGION;
    }

    /**
     * Uploads a file to Cloudflare R2 bucket using AWS Signature Version 4
     * 
     * @param string $sourceFilePath Local temporary file path
     * @param string $r2Key Object key (path in R2 bucket)
     * @param string $contentType MIME type
     * @return array ['success' => bool, 'url' => string, 'key' => string, 'error' => string]
     */
    public function uploadFile($sourceFilePath, $r2Key, $contentType = 'application/octet-stream') {
        if (!file_exists($sourceFilePath)) {
            return ['success' => false, 'error' => 'Source file does not exist.'];
        }

        $fileData = file_get_contents($sourceFilePath);
        if ($fileData === false) {
            return ['success' => false, 'error' => 'Failed to read source file.'];
        }

        return $this->putObject($r2Key, $fileData, $contentType);
    }

    /**
     * Put object contents into R2 bucket
     */
    public function putObject($r2Key, $content, $contentType = 'application/octet-stream') {
        $host = "{$this->accountId}.r2.cloudflarestorage.com";
        $uri = "/{$this->bucketName}/" . ltrim($r2Key, '/');
        $url = "https://{$host}{$uri}";

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $payloadHash = hash('sha256', $content);

        // Canonical Headers
        $canonicalHeaders = "host:{$host}\n"
                          . "x-amz-content-sha256:{$payloadHash}\n"
                          . "x-amz-date:{$amzDate}\n";
        $signedHeaders = "host;x-amz-content-sha256;x-amz-date";

        // Canonical Request
        $canonicalRequest = "PUT\n"
                          . $uri . "\n"
                          . "\n"
                          . $canonicalHeaders . "\n"
                          . $signedHeaders . "\n"
                          . $payloadHash;

        // String to sign
        $algorithm = "AWS4-HMAC-SHA256";
        $credentialScope = "{$dateStamp}/{$this->region}/s3/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        // Calculate Signature
        $kSecret = "AWS4" . $this->secretKey;
        $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
        $kRegion = hash_hmac('sha256', $this->region, $kDate, true);
        $kService = hash_hmac('sha256', 's3', $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        $authorization = "{$algorithm} "
                       . "Credential={$this->accessKey}/{$credentialScope}, "
                       . "SignedHeaders={$signedHeaders}, "
                       . "Signature={$signature}";

        $headers = [
            "Host: {$host}",
            "Content-Type: {$contentType}",
            "x-amz-date: {$amzDate}",
            "x-amz-content-sha256: {$payloadHash}",
            "Authorization: {$authorization}",
            "Content-Length: " . strlen($content)
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $publicUrl = $this->publicUrl . '/' . ltrim($r2Key, '/');
            return [
                'success' => true,
                'url' => $publicUrl,
                'key' => $r2Key,
                'http_code' => $httpCode
            ];
        } else {
            return [
                'success' => false,
                'error' => $curlError ?: "R2 Upload failed with HTTP {$httpCode}: {$response}",
                'http_code' => $httpCode,
                'raw_response' => $response
            ];
        }
    }

    public function getPublicUrl($r2Key) {
        return $this->publicUrl . '/' . ltrim($r2Key, '/');
    }
}
?>

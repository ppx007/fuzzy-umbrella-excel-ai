# API 测试脚本
# 请在 PowerShell 中运行此脚本

# 从 .env 文件读取配置
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$apiKey = ""
$baseUrl = "https://cat.beijixingxing.com/v1"
$model = "假流式/gemini-2.5-flash"

foreach ($line in $envContent) {
    if ($line -match "^VITE_OPENAI_API_KEY=(.+)$") {
        $apiKey = $matches[1]
    }
    if ($line -match "^VITE_OPENAI_API_BASE=(.+)$") {
        $baseUrl = $matches[1]
    }
    if ($line -match "^VITE_OPENAI_MODEL=(.+)$") {
        $model = $matches[1]
    }
}

Write-Host "=== API 测试 ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl"
Write-Host "Model: $model"
Write-Host "API Key (前6位): $($apiKey.Substring(0, [Math]::Min(6, $apiKey.Length)))..."
Write-Host ""

$body = @{
    model = $model
    messages = @(
        @{
            role = "user"
            content = "创建一个2行2列的简单表格"
        }
    )
    stream = $false
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $apiKey"
}

$url = "$baseUrl/chat/completions"
Write-Host "请求 URL: $url" -ForegroundColor Yellow
Write-Host "请求体:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""
Write-Host "正在发送请求..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 120
    Write-Host "=== 成功响应 ===" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "=== 请求失败 ===" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody"
    }
}
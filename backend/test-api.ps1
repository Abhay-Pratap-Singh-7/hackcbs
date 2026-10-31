# Quick API Test Script for Windows PowerShell
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Testing SIH Backend API (Localhost:5000)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null
    )

    Write-Host "`n[*] $Name ($Method $Url)..." -NoNewline
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 10
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 5)
        }

        $res = Invoke-RestMethod @params
        Write-Host " [SUCCESS 200]" -ForegroundColor Green
        $res | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
            Write-Host $errBody -ForegroundColor Yellow
        } else {
            Write-Host $_.Exception.Message -ForegroundColor Yellow
        }
    }
}

# 1. Health check
Test-Endpoint -Name "Health Check" -Method "GET" -Url "http://localhost:5000/api/health"

# 2. Translation API
Test-Endpoint -Name "Hindi Translation" -Method "POST" -Url "http://localhost:5000/api/translate/text" -Body @{
    text = "Road repair needed urgently in Sector 4"
    targetLang = "Hindi"
}

# 3. FCM Status
Test-Endpoint -Name "FCM Diagnostic Status" -Method "GET" -Url "http://localhost:5000/api/notifications/fcm-status"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan

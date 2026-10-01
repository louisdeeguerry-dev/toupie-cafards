param(
    [int]$Port = 8080
)

$RootDir = $PSScriptRoot

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript'
    '.css'  = 'text/css'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()
Write-Host "Serveur demarre : http://0.0.0.0:$Port  (dossier: $RootDir)"

while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $requestLine = $reader.ReadLine()
        while (($line = $reader.ReadLine()) -and $line -ne '') { }

        if ($requestLine -match '^GET\s+(\S+)\s+HTTP') {
            $path = $matches[1] -split '\?' | Select-Object -First 1
            if ($path -eq '/') { $path = '/index.html' }
            $safePath = $path.TrimStart('/') -replace '\.\.', ''
            $filePath = Join-Path $RootDir $safePath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath)
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                $stream.Write([System.Text.Encoding]::ASCII.GetBytes($header), 0, [System.Text.Encoding]::ASCII.GetByteCount($header))
                $stream.Write($bytes, 0, $bytes.Length)
            } else {
                $body = "404 Not Found: $path"
                $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
                $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`n`r`n"
                $stream.Write([System.Text.Encoding]::ASCII.GetBytes($header), 0, [System.Text.Encoding]::ASCII.GetByteCount($header))
                $stream.Write($bodyBytes, 0, $bodyBytes.Length)
            }
        }
        $stream.Close()
    } catch {
    } finally {
        $client.Close()
    }
}

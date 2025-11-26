# Script para converter icon.jpeg para os formatos necessários
# Execute este script na pasta mobile-app/assets/

Write-Host "🔄 Convertendo icon.jpeg para os formatos necessários..." -ForegroundColor Green

$iconJpeg = "icon.jpeg"

if (-not (Test-Path $iconJpeg)) {
    Write-Host "❌ Erro: icon.jpeg não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de que o arquivo está em: mobile-app/assets/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ icon.jpeg encontrado!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Este script requer .NET Framework ou uma ferramenta externa." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 OPÇÕES PARA CONVERTER:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPÇÃO 1 - Online (Mais Fácil):" -ForegroundColor White
Write-Host "   1. Acesse: https://convertio.co/pt/jpg-png/ ou https://cloudconvert.com/jpeg-to-png" -ForegroundColor Gray
Write-Host "   2. Faça upload do icon.jpeg" -ForegroundColor Gray
Write-Host "   3. Baixe como icon.png (1024x1024 pixels)" -ForegroundColor Gray
Write-Host "   4. Use o mesmo arquivo para:" -ForegroundColor Gray
Write-Host "      - icon.png (1024x1024)" -ForegroundColor Gray
Write-Host "      - splash-icon.png (1024x1024, fundo transparente se possível)" -ForegroundColor Gray
Write-Host "      - adaptive-icon.png (1024x1024, fundo transparente, centralizado)" -ForegroundColor Gray
Write-Host "      - favicon.png (48x48 ou 96x96)" -ForegroundColor Gray
Write-Host ""
Write-Host "OPÇÃO 2 - Usando Paint/Photoshop/GIMP:" -ForegroundColor White
Write-Host "   1. Abra o icon.jpeg no editor" -ForegroundColor Gray
Write-Host "   2. Redimensione para 1024x1024 pixels" -ForegroundColor Gray
Write-Host "   3. Salve como PNG:" -ForegroundColor Gray
Write-Host "      - icon.png" -ForegroundColor Gray
Write-Host "      - splash-icon.png (mesmo arquivo)" -ForegroundColor Gray
Write-Host "      - adaptive-icon.png (mesmo arquivo, centralizado)" -ForegroundColor Gray
Write-Host "   4. Para favicon.png: redimensione para 48x48 ou 96x96" -ForegroundColor Gray
Write-Host ""
Write-Host "OPÇÃO 3 - Usando Python (se tiver instalado):" -ForegroundColor White
Write-Host "   Execute: python converter_logo.py" -ForegroundColor Gray
Write-Host ""

# Tentar usar .NET para conversão (se disponível)
try {
    Add-Type -AssemblyName System.Drawing
    
    $image = [System.Drawing.Image]::FromFile((Resolve-Path $iconJpeg).Path)
    $bitmap = New-Object System.Drawing.Bitmap($image)
    
    # Criar icon.png
    $iconPng = "icon.png"
    $bitmap.Save($iconPng, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "✅ Criado: icon.png" -ForegroundColor Green
    
    # Criar splash-icon.png (mesmo arquivo)
    Copy-Item $iconPng "splash-icon.png"
    Write-Host "✅ Criado: splash-icon.png" -ForegroundColor Green
    
    # Criar adaptive-icon.png (mesmo arquivo)
    Copy-Item $iconPng "adaptive-icon.png"
    Write-Host "✅ Criado: adaptive-icon.png" -ForegroundColor Green
    
    # Criar favicon.png (redimensionado)
    $faviconSize = 96
    $favicon = New-Object System.Drawing.Bitmap($faviconSize, $faviconSize)
    $graphics = [System.Drawing.Graphics]::FromImage($favicon)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($bitmap, 0, 0, $faviconSize, $faviconSize)
    $favicon.Save("favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "✅ Criado: favicon.png (96x96)" -ForegroundColor Green
    
    $bitmap.Dispose()
    $image.Dispose()
    $graphics.Dispose()
    $favicon.Dispose()
    
    Write-Host ""
    Write-Host "🎉 Conversão concluída com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   - Verifique se icon.png tem 1024x1024 pixels" -ForegroundColor Yellow
    Write-Host "   - Para melhor resultado, edite splash-icon.png e adaptive-icon.png" -ForegroundColor Yellow
    Write-Host "     para ter fundo transparente (se necessário)" -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "⚠️  Não foi possível converter automaticamente." -ForegroundColor Yellow
    Write-Host "   Use uma das opções acima para converter manualmente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}


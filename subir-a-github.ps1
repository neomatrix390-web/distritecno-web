# ============================================================
#  Distritecno — Subir sitio web a GitHub
#  Ejecutar desde PowerShell en la carpeta del sitio
# ============================================================

# ── CONFIGURACIÓN ────────────────────────────────────────────
$REPO_NAME   = "distritecno-web"
$BRANCH      = "main"

# El usuario de GitHub no puede quedar vacío: un ENTER en blanco armaría
# un remote roto (https://github.com//distritecno-web.git) y el push falla
$GITHUB_USER = ""
for ($intento = 1; $intento -le 3 -and -not $GITHUB_USER; $intento++) {
    $GITHUB_USER = "$(Read-Host 'Ingresá tu usuario de GitHub')".Trim()
    if (-not $GITHUB_USER) {
        Write-Host "  ✗ El usuario no puede estar vacío." -ForegroundColor Red
    }
}
if (-not $GITHUB_USER) {
    Write-Host ""
    Write-Host "✗ No se ingresó un usuario de GitHub. Cancelando." -ForegroundColor Red
    exit 1
}
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  DISTRITECNO — Deploy a GitHub" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 1. Inicializar git si no existe
if (-not (Test-Path ".git")) {
    Write-Host "► Inicializando repositorio git..." -ForegroundColor Yellow
    git init
    git checkout -b $BRANCH
} else {
    Write-Host "✓ Repositorio git ya existe" -ForegroundColor Green
}

# 2. Agregar todos los archivos
Write-Host "► Agregando archivos..." -ForegroundColor Yellow
git add .

# 3. Commit — solo si hay algo staged, y si falla se corta acá
git diff --cached --quiet
$hayCambios = ($LASTEXITCODE -ne 0)

if ($hayCambios) {
    $fecha = Get-Date -Format "dd/MM/yyyy HH:mm"
    git commit -m "Actualización sitio web Distritecno — $fecha"
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "✗ El commit falló. Cancelando sin subir nada." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ No hay cambios nuevos para commitear" -ForegroundColor Green
}

# 4. Conectar con el repo remoto
#    Si origin ya existe, se saltea todo el instructivo de crear el repo
$REMOTE_URL = "https://github.com/$GITHUB_USER/$REPO_NAME.git"
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "✓ Remote ya configurado: $existingRemote" -ForegroundColor Green
    git remote set-url origin $REMOTE_URL
} else {
    Write-Host ""
    Write-Host "► Creando repositorio en GitHub..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Abrí esta URL en tu navegador para crear el repo:" -ForegroundColor White
    Write-Host "  https://github.com/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Configuración recomendada:" -ForegroundColor White
    Write-Host "  • Repository name: $REPO_NAME" -ForegroundColor Gray
    Write-Host "  • Visibility: Public" -ForegroundColor Gray
    Write-Host "  • NO tildes 'Add README', 'Add .gitignore' ni 'Choose license'" -ForegroundColor Gray
    Write-Host ""
    Read-Host "  Cuando lo hayas creado, presioná ENTER para continuar"

    Write-Host "► Conectando con GitHub ($REMOTE_URL)..." -ForegroundColor Yellow
    git remote add origin $REMOTE_URL
}

# 5. Push — si falla, no mostrar el cartel de éxito
Write-Host "► Subiendo archivos a GitHub..." -ForegroundColor Yellow
git push -u origin $BRANCH
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ El push falló. Revisá el error de arriba." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✓ LISTO — Sitio subido a GitHub" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "  Repo: https://github.com/$GITHUB_USER/$REPO_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PRÓXIMO PASO — Publicar gratis en GitHub Pages:" -ForegroundColor White
Write-Host "  1. Entrá a tu repo en GitHub" -ForegroundColor Gray
Write-Host "  2. Ve a Settings > Pages" -ForegroundColor Gray
Write-Host "  3. En 'Build and deployment' > 'Source', elegí 'Deploy from a branch'" -ForegroundColor Gray
Write-Host "  4. Seleccioná la rama 'main' y la carpeta '/ (root)'" -ForegroundColor Gray
Write-Host "  5. Clic en Save. En 1 min tendrás tu URL pública github.io" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para conectar distritecno7.com.ar:" -ForegroundColor White
Write-Host "  En Settings > Pages > Custom domain, agregá tu dominio" -ForegroundColor Gray
Write-Host ""

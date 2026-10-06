$ErrorActionPreference = "Continue"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Iniciando Destrucción de Entorno 360PARTES            " -ForegroundColor Cyan -BackgroundColor DarkRed
Write-Host "=======================================================" -ForegroundColor Cyan

# Las credenciales viven en backend/aws-credentials.ps1 (ignorado por git)
. "$PSScriptRoot\aws-credentials.ps1"

$IdentityJson = aws sts get-caller-identity --output json 2>$null
if ($LASTEXITCODE -ne 0) { 
    Write-Host "`n[ERROR] Credenciales de AWS inválidas o expiradas." -ForegroundColor Red
    Write-Host "Por favor, copia las credenciales nuevas de tu AWS Learner Lab (AWS Details -> AWS CLI)" -ForegroundColor Yellow
    Write-Host "y pégalas en las líneas 8, 9 y 10 de este archivo." -ForegroundColor Yellow
    exit 1 
}

Write-Host "`n[Instancias] Buscando y terminando la instancia EC2..." -ForegroundColor Yellow
$Instances = aws ec2 describe-instances --filters "Name=tag:Name,Values=server_360partes" "Name=instance-state-name,Values=running,pending,stopped,stopping" --query "Reservations[*].Instances[*].InstanceId" --output text 2>$null
$InstArray = @($Instances -split '\s+' | Where-Object { $_ -match '^i-' })
if ($InstArray.Count -gt 0) {
    Write-Host "Terminando instancias: $($InstArray -join ', ')" -ForegroundColor Cyan
    aws ec2 terminate-instances --instance-ids $InstArray | Out-Null
    Write-Host "Esperando a que la instancia se termine..." -ForegroundColor Yellow
    aws ec2 wait instance-terminated --instance-ids $InstArray
} else {
    Write-Host "No se encontraron instancias para terminar." -ForegroundColor Green
}

Write-Host "`n[Security Groups] Eliminando Grupo de Seguridad..." -ForegroundColor Yellow
$SgName = "sg_360partes"
$SgId = aws ec2 describe-security-groups --group-names $SgName --query "SecurityGroups[0].GroupId" --output text 2>$null
if ($SgId -ne "" -and $SgId -ne "None") {
    # Eliminar las reglas primero puede ser necesario si hay dependencias circulares, aunque no las hay en este SG
    aws ec2 delete-security-group --group-id $SgId 2>$null
    Write-Host "Grupo de Seguridad $SgName eliminado." -ForegroundColor Green
} else {
    Write-Host "No se encontró el Grupo de Seguridad $SgName." -ForegroundColor Green
}

Write-Host "`n[Red] Eliminando VPC, Subnet e Internet Gateway creados por deploy..." -ForegroundColor Yellow
$VpcIds = @((aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc_360partes" --query "Vpcs[*].VpcId" --output text 2>$null) -split '\s+' | Where-Object { $_ -match '^vpc-' })
foreach ($Vpc in $VpcIds) {
    # Security groups restantes de la VPC (excepto default)
    $Sgs = @((aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$Vpc" --query "SecurityGroups[?GroupName!='default'].GroupId" --output text 2>$null) -split '\s+' | Where-Object { $_ -match '^sg-' })
    foreach ($s in $Sgs) { aws ec2 delete-security-group --group-id $s 2>$null }
    $Igws = @((aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$Vpc" --query "InternetGateways[*].InternetGatewayId" --output text 2>$null) -split '\s+' | Where-Object { $_ -match '^igw-' })
    foreach ($g in $Igws) {
        aws ec2 detach-internet-gateway --internet-gateway-id $g --vpc-id $Vpc 2>$null
        aws ec2 delete-internet-gateway --internet-gateway-id $g 2>$null
    }
    $Subs = @((aws ec2 describe-subnets --filters "Name=vpc-id,Values=$Vpc" --query "Subnets[*].SubnetId" --output text 2>$null) -split '\s+' | Where-Object { $_ -match '^subnet-' })
    foreach ($sn in $Subs) { aws ec2 delete-subnet --subnet-id $sn 2>$null }
    aws ec2 delete-vpc --vpc-id $Vpc 2>$null
    Write-Host "VPC $Vpc eliminada." -ForegroundColor Green
}
if ($VpcIds.Count -eq 0) { Write-Host "No hay VPC creada por deploy (se usaba una existente)." -ForegroundColor Green }

Write-Host "`n[Key Pairs] Eliminando Key Pair..." -ForegroundColor Yellow
$KeyName = "key_360partes"
aws ec2 delete-key-pair --key-name $KeyName 2>$null
if (Test-Path "$KeyName.pem") { 
    Remove-Item "$KeyName.pem" -Force 
    Write-Host "Archivo de llave $KeyName.pem local eliminado." -ForegroundColor Green
}

Write-Host "`n[App Móvil] Restaurando la configuración de red en la app móvil..." -ForegroundColor Yellow
$DartFile = "..\mobile\lib\api\api_client.dart"
if (Test-Path $DartFile) {
    $DartContent = Get-Content $DartFile -Raw
    
    $OriginalBaseUrlBlock = @"
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api/v1'; // Para Flutter Web
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000/api/v1'; // Para Android Emulator
    } else {
      return 'http://localhost:8000/api/v1'; // Para iOS Simulator u otros
    }
  }
"@
    
    # Expresión regular que busca el bloque "static String get baseUrl { ... }" y lo reemplaza con el original
    $DartContent = $DartContent -replace '(?s)  static String get baseUrl \{.*?\r?\n  \}', $OriginalBaseUrlBlock.TrimEnd()
    
    Set-Content -Path $DartFile -Value $DartContent
    Write-Host "Archivo api_client.dart restaurado a localhost / 10.0.2.2 exitosamente." -ForegroundColor Green
} else {
    Write-Host "Advertencia: No se encontró el archivo $DartFile" -ForegroundColor Red
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "¡Destrucción Completada! El entorno ha sido limpiado." -ForegroundColor Green -BackgroundColor Black
Write-Host "=======================================================" -ForegroundColor Cyan

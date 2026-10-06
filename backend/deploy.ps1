$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Iniciando Despliegue 360PARTES en EC2                 " -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Configurar y Validar Autenticación
# Las credenciales viven en backend/aws-credentials.ps1 (ignorado por git)
. "$PSScriptRoot\aws-credentials.ps1"

$oldErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$IdentityJson = aws sts get-caller-identity --output json 2>$null
$ErrorActionPreference = $oldErr

if ($LASTEXITCODE -ne 0) { 
    Write-Host "`n[ERROR] Credenciales de AWS inválidas o expiradas." -ForegroundColor Red
    Write-Host "Por favor, copia las credenciales nuevas de tu AWS Learner Lab (AWS Details -> AWS CLI)" -ForegroundColor Yellow
    Write-Host "y pégalas en las líneas 9, 10 y 11 de este archivo deploy (1).ps1." -ForegroundColor Yellow
    exit 1 
}

Write-Host "`n[Fase 1: Red y Seguridad]" -ForegroundColor Yellow

$SubnetId = aws ec2 describe-subnets --query "Subnets[0].SubnetId" --output text 2>$null
$VpcId = ""

if ($SubnetId -eq "None" -or $SubnetId -eq "") {
    Write-Host "No se encontraron Subnets. Creando VPC y Subnet básicas..." -ForegroundColor Yellow
    $VpcId = aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query "Vpc.VpcId" --output text
    aws ec2 create-tags --resources $VpcId --tags Key=Name,Value=vpc_360partes | Out-Null
    aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-support | Out-Null
    aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-hostnames | Out-Null
    
    $SubnetId = aws ec2 create-subnet --vpc-id $VpcId --cidr-block 10.0.1.0/24 --query "Subnet.SubnetId" --output text
    aws ec2 modify-subnet-attribute --subnet-id $SubnetId --map-public-ip-on-launch | Out-Null
    
    $IgwId = aws ec2 create-internet-gateway --query "InternetGateway.InternetGatewayId" --output text
    aws ec2 attach-internet-gateway --vpc-id $VpcId --internet-gateway-id $IgwId | Out-Null
    
    $RtId = aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VpcId" --query "RouteTables[0].RouteTableId" --output text
    aws ec2 create-route --route-table-id $RtId --destination-cidr-block 0.0.0.0/0 --gateway-id $IgwId | Out-Null
} else {
    $VpcId = aws ec2 describe-subnets --subnet-ids $SubnetId --query "Subnets[0].VpcId" --output text 2>$null
    Write-Host "Usando Subnet: $SubnetId en VPC: $VpcId" -ForegroundColor Yellow
}

$SgName = "sg_360partes"
$SgId = aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VpcId" "Name=group-name,Values=$SgName" --query "SecurityGroups[0].GroupId" --output text 2>$null

if ($LASTEXITCODE -ne 0 -or $SgId -eq "" -or $SgId -eq "None") {
    Write-Host "Creando Grupo de Seguridad: $SgName..." -ForegroundColor Cyan
    if ($VpcId -ne "None" -and $VpcId -ne "") {
        $SgId = aws ec2 create-security-group --group-name $SgName --description "SG para 360PARTES" --vpc-id $VpcId --query "GroupId" --output text
    } else {
        $SgId = aws ec2 create-security-group --group-name $SgName --description "SG para 360PARTES" --query "GroupId" --output text
    }
    
    aws ec2 create-tags --resources $SgId --tags Key=Name,Value=$SgName | Out-Null
    
    # Reglas de entrada: SSH (22), Backend (8000), Minio (9000, 9001), Web (80 y 5173), Postgres (5432)
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 8000 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 9000 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 9001 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 5173 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SgId --protocol tcp --port 5432 --cidr 0.0.0.0/0 | Out-Null
} else {
    Write-Host "Usando Grupo de Seguridad existente: $SgId" -ForegroundColor Cyan
}

$KeyName = "key_360partes"
$oldErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"
aws ec2 describe-key-pairs --key-names $KeyName 2>$null | Out-Null
$ErrorActionPreference = $oldErr
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creando Key Pair: $KeyName..." -ForegroundColor Cyan
    aws ec2 create-key-pair --key-name $KeyName --query "KeyMaterial" --output text > "$KeyName.pem"
}

$AmiId = aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64 --query "Parameters[0].Value" --output text
$IamProfile = "LabInstanceProfile"

Write-Host "`n[Fase 2: Instancia EC2 y Docker]" -ForegroundColor Yellow

$UserData = @"
#!/bin/bash
yum update -y
yum install -y git docker
systemctl enable docker
systemctl start docker
usermod -a -G docker ec2-user

mkdir -p /usr/local/lib/docker/cli-plugins
curl -L "https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64" -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

cd /home/ec2-user
git clone https://github.com/javieravila1/360PARTES.git app
chown -R ec2-user:ec2-user app
cd app

PUBLIC_IP=`curl -s http://169.254.169.254/latest/meta-data/public-ipv4`
# Actualizar el frontend VITE_API_URL en el docker-compose.yml si fuera necesario
sed -i "s/http:\/\/localhost:8000\/api\/v1/http:\/\/\$PUBLIC_IP:8000\/api\/v1/g" docker-compose.yml

/usr/local/bin/docker-compose up -d --build
"@

$UdEnc = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($UserData))

Write-Host "Lanzando instancia EC2 t3.small en la subnet $SubnetId..." -ForegroundColor Cyan
$InstanceId = aws ec2 run-instances --image-id $AmiId --instance-type t3.small --subnet-id $SubnetId --key-name $KeyName --security-group-ids $SgId --iam-instance-profile "Name=$IamProfile" --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp3}" --user-data $UdEnc --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=server_360partes}]" --query "Instances[0].InstanceId" --output text

Write-Host "Esperando a que la instancia $InstanceId esté en ejecución..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $InstanceId

$PublicIp = aws ec2 describe-instances --instance-ids $InstanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text
Write-Host "IP Pública de la instancia: $PublicIp" -ForegroundColor Green

Write-Host "`n[Fase 3: Configurando la App Móvil]" -ForegroundColor Yellow
$DartFile = "..\mobile\lib\api\api_client.dart"
if (Test-Path $DartFile) {
    $DartContent = Get-Content $DartFile -Raw
    
    # Reemplazamos cualquier IP local (localhost o 10.0.2.2 o anterior) con la nueva IP publica
    $DartContent = $DartContent -replace "http://localhost:8000/api/v1", "http://${PublicIp}:8000/api/v1"
    $DartContent = $DartContent -replace "http://10.0.2.2:8000/api/v1", "http://${PublicIp}:8000/api/v1"
    $DartContent = $DartContent -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:8000/api/v1", "http://${PublicIp}:8000/api/v1"
    
    # También arreglar si quedó arruinado (http:///api/v1)
    $DartContent = $DartContent -replace "http:///api/v1", "http://${PublicIp}:8000/api/v1"
    
    Set-Content -Path $DartFile -Value $DartContent
    Write-Host "Archivo api_client.dart actualizado exitosamente con la IP $PublicIp" -ForegroundColor Green
} else {
    Write-Host "Advertencia: No se encontró el archivo $DartFile" -ForegroundColor Red
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "¡Despliegue Finalizado!" -ForegroundColor Green -BackgroundColor Black
Write-Host "La instancia está instalando Docker y levantando los contenedores (tardará de 2 a 5 minutos)."
Write-Host "URL Backend: http://${PublicIp}:8000/api/v1"
Write-Host "URL Minio:   http://${PublicIp}:9001 (Console)"
Write-Host "URL Web:     http://${PublicIp}"
Write-Host "=======================================================" -ForegroundColor Cyan

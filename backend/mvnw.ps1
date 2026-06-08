param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $MavenArgs
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$wrapperProperties = Join-Path $projectDir ".mvn\wrapper\maven-wrapper.properties"
$mavenHome = Join-Path $projectDir ".mvn\apache-maven-3.9.9"
$mavenZip = Join-Path $projectDir ".mvn\apache-maven-3.9.9-bin.zip"

function Read-WrapperProperty([string] $Name) {
    $line = Get-Content $wrapperProperties |
        Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=" } |
        Select-Object -First 1

    if (-not $line) {
        throw "Missing '$Name' in $wrapperProperties"
    }

    return ($line -split "=", 2)[1].Trim()
}

function Get-Sha512([string] $Path) {
    return (Get-FileHash -Algorithm SHA512 -Path $Path).Hash.ToLowerInvariant()
}

function Quote-CmdArgument([string] $Value) {
    return '"' + ($Value -replace '"', '\"') + '"'
}

if (-not (Test-Path (Join-Path $mavenHome "bin\mvn.cmd"))) {
    $distributionUrl = Read-WrapperProperty "distributionUrl"
    $expectedHash = Read-WrapperProperty "distributionSha512Sum"

    New-Item -ItemType Directory -Force -Path (Join-Path $projectDir ".mvn") | Out-Null

    if (-not (Test-Path $mavenZip)) {
        Write-Host "Downloading Apache Maven 3.9.9..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $distributionUrl -OutFile $mavenZip
    }

    $actualHash = Get-Sha512 $mavenZip
    if ($actualHash -ne $expectedHash) {
        Remove-Item -Force $mavenZip
        throw "Downloaded Maven archive hash mismatch. Expected $expectedHash but got $actualHash."
    }

    Write-Host "Extracting Apache Maven 3.9.9..."
    Expand-Archive -Force -Path $mavenZip -DestinationPath (Join-Path $projectDir ".mvn")
}

$mvn = Join-Path $mavenHome "bin\mvn.cmd"
$cmd = Join-Path $env:SystemRoot "System32\cmd.exe"
$command = Quote-CmdArgument $mvn

foreach ($arg in $MavenArgs) {
    $command += " " + (Quote-CmdArgument $arg)
}

& $cmd /d /c $command
exit $LASTEXITCODE

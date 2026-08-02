param(
  [string]$SpiWorkbook = 'public/EI VI MPI with components.xlsx',
  [string]$GesiWorkbook = 'public/All combined for power bi gesi lens with ei vi mpi v2.xlsx',
  [string]$ShapefileCsv = 'public/shp/ward_shp/output.csv',
  [string]$Output = 'lib/dashboard-data.json'
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-CellColumn([string]$reference) { ([regex]::Match($reference, '^[A-Z]+')).Value }
function Get-Key([string]$value) { (($value -replace '\s*\(.*?\)', '') -replace '[^a-zA-Z0-9]+', '').ToLowerInvariant() }
$HouseholdCategories = @(
  @{ label = 'Janajati'; pattern = 'Janajati' }, @{ label = 'Chhetri'; pattern = 'Chhetri' },
  @{ label = 'Madhesi'; pattern = 'Madhesi' }, @{ label = 'Dalit'; pattern = 'Dalit' },
  @{ label = 'Brahmin'; pattern = 'Brahmin' }, @{ label = 'Muslim'; pattern = 'Muslim' },
  @{ label = 'Single woman'; pattern = 'Single woman' }, @{ label = 'Landless'; pattern = 'Landless' },
  @{ label = 'Household with PWD'; pattern = 'PWD|disabilit' }, @{ label = 'Remote/isolated'; pattern = 'Remote|isolated' }
)
function Get-CanonicalMunicipalityName([string]$value) {
  $canonicalNames = @{
    'gadhi' = 'Gadhi'; 'sunkoshi' = 'Sunkoshi'; 'belaka' = 'Belaka'
    'hanumanangarkankalani' = 'Hanumannagar Kankalani'; 'hanumanangar' = 'Hanumannagar Kankalani'
    'hanumannagarkankalini' = 'Hanumannagar Kankalani'
    'hanumannagarkankalinisaptari' = 'Hanumannagar Kankalani'
    'kepilasagadhi' = 'Kepilasagadhi'; 'kepilasgadhi' = 'Kepilasagadhi'
    'halesituwachung' = 'Halesi Tuwachung'; 'halesi' = 'Halesi Tuwachung'
  }
  $key = Get-Key $value
  if ($canonicalNames.ContainsKey($key)) { return $canonicalNames[$key] }
  return $value.Trim()
}
function Get-HouseholdLabel([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return 'Other' }
  foreach ($category in $HouseholdCategories) { if ($value -match $category.pattern) { return $category.label } }
  if ($value -match '/\s*(.+)$') { return $Matches[1].Trim() }
  return $value.Trim()
}

function Read-XlsxColumns([string]$file, [string[]]$fields) {
  $archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $file))
  try {
    function Read-Entry([string]$name) {
      $entry = $archive.GetEntry($name)
      $reader = [IO.StreamReader]::new($entry.Open())
      try { $reader.ReadToEnd() } finally { $reader.Dispose() }
    }
    [xml]$sharedXml = Read-Entry 'xl/sharedStrings.xml'
    [xml]$sheetXml = Read-Entry 'xl/worksheets/sheet1.xml'
    $ns = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $shared = @($sharedXml.SelectNodes('//x:sst/x:si', $ns) | ForEach-Object { $_.InnerText })
    function Get-Value($cell) {
      $value = $cell.SelectSingleNode('x:v', $ns)
      if ($null -eq $value) { return '' }
      if ($cell.t -eq 's') { return $shared[[int]$value.InnerText] }
      return $value.InnerText
    }
    $rows = @($sheetXml.SelectNodes('//x:worksheet/x:sheetData/x:row', $ns))
    $headerByColumn = @{}
    foreach ($cell in $rows[0].SelectNodes('x:c', $ns)) { $headerByColumn[(Get-CellColumn $cell.r)] = Get-Value $cell }
    $columns = @{}
    foreach ($field in $fields) {
      $match = $headerByColumn.GetEnumerator() | Where-Object { $_.Value -eq $field } | Select-Object -First 1
      if ($null -eq $match) { throw "Column '$field' was not found in $file" }
      $columns[$field] = $match.Key
    }
    $result = [System.Collections.Generic.List[object]]::new()
    foreach ($row in ($rows | Select-Object -Skip 1)) {
      $values = @{}
      foreach ($cell in $row.SelectNodes('x:c', $ns)) {
        $column = Get-CellColumn $cell.r
        foreach ($field in $fields) { if ($columns[$field] -eq $column) { $values[$field] = Get-Value $cell } }
      }
      $item = [ordered]@{}
      foreach ($field in $fields) { $item[$field] = if ($values.ContainsKey($field)) { $values[$field] } else { '' } }
      $result.Add([pscustomobject]$item)
    }
    return $result
  } finally { $archive.Dispose() }
}

function New-Distribution($rows, [string]$field) {
  if ($rows.Count -eq 0) { return @() }
  $counts = @{}
  $labelsByRawValue = @{}
  foreach ($row in $rows) {
    $rawValue = [string]$row.$field
    if (-not $labelsByRawValue.ContainsKey($rawValue)) {
      $labelsByRawValue[$rawValue] = if ($field -eq 'b3_hh_type') { Get-HouseholdLabel $rawValue } elseif ($rawValue -eq 'Other (specify)' -and -not [string]::IsNullOrWhiteSpace($row.b2_religion_other)) { "Other: $($row.b2_religion_other.Trim())" } else { $rawValue }
    }
    $label = $labelsByRawValue[$rawValue]
    if (-not $counts.ContainsKey($label)) { $counts[$label] = 0 }
    $counts[$label]++
  }
  $distribution = @($counts.GetEnumerator() | ForEach-Object {
    [ordered]@{ name = $_.Key; value = [Math]::Round(100 * $_.Value / $rows.Count, 1) }
  })
  return @($distribution | Sort-Object -Property @{ Expression = { [double]$_.value }; Descending = $true })
}

function New-Profile($rows) {
  if ($rows.Count -eq 0) { return [ordered]@{ totalHouseholds = 0; femaleHeaded = 0; maleHeaded = 0; religion = @(); householdType = @() } }
  $female = @($rows | Where-Object { $_.'b1_head_sex' -match 'Female' }).Count
  return [ordered]@{
    totalHouseholds = $rows.Count
    femaleHeaded = [Math]::Round(100 * $female / $rows.Count, 1)
    maleHeaded = [Math]::Round(100 - (100 * $female / $rows.Count), 1)
    religion = New-Distribution $rows 'b2_religion'
    householdType = New-Distribution $rows 'b3_hh_type'
  }
}

function Resolve-ShapefileMunicipality($name, $shapefileRows) {
  $key = Get-Key $name
  # Sunkoshi exists in several districts; the Sindhuli municipality is the dashboard target.
  $candidates = @($shapefileRows | Where-Object {
    (Get-Key $_.PALIKA) -eq $key -and ($key -ne 'sunkoshi' -or $_.DISTRICT -eq 'SINDHULI')
  })

  if ($candidates.Count -eq 0) {
    # These are source-name spelling/abbreviation differences, not district assumptions.
    $palikaAliases = @{ kepilasgadhi = 'Kepilasagadhi'; halesi = 'Halesi Tuwachung'; hanumanangar = 'Hanumannagar Kankalani' }
    if ($palikaAliases.ContainsKey($key)) {
      $aliasKey = Get-Key $palikaAliases[$key]
      $candidates = @($shapefileRows | Where-Object { (Get-Key $_.PALIKA) -eq $aliasKey })
    }
  }

  if ($candidates.Count -eq 0) { return $null }
  $match = $candidates | Select-Object -First 1
  return [pscustomobject]@{ palika = $match.PALIKA; district = $match.DISTRICT }
}

$spiFields = @(
  'Municipality', 'Ward', 'SPI',
  'Socio-economic', 'Institutional', 'Political', 'Cultural', 'Spatial', 'EI', 'EI%',
  'H', 'A', 'MPI', 'MPI%',
  'Contribution % 1.1', 'Contribution % 1.2', 'Contribution % 2.1', 'Contribution % 2.2',
  'Contribution % 3.1', 'Contribution % 3.2', 'Contribution % 3.3', 'Contribution % 3.4', 'Contribution % 3.5', 'Contribution % 3.6',
  'E', 'S', 'C', 'VI', 'VI%'
)
$spiRows = Read-XlsxColumns $SpiWorkbook $spiFields
function Get-Num($row, [string]$field) { if ($row.$field) { [double]$row.$field } else { 0 } }
function New-ExclusionComponents($row) {
  [ordered]@{
    socioEconomic = [Math]::Round((Get-Num $row 'Socio-economic'), 2)
    institutional = [Math]::Round((Get-Num $row 'Institutional'), 2)
    political = [Math]::Round((Get-Num $row 'Political'), 2)
    cultural = [Math]::Round((Get-Num $row 'Cultural'), 2)
    spatial = [Math]::Round((Get-Num $row 'Spatial'), 2)
  }
}
function New-PovertyComponents($row) {
  [ordered]@{
    headcountRatio = [Math]::Round((Get-Num $row 'H'), 3)
    intensity = [Math]::Round((Get-Num $row 'A'), 3)
    health = @(
      [ordered]@{ name = 'Nutrition'; value = [Math]::Round((Get-Num $row 'Contribution % 1.1'), 2) }
      [ordered]@{ name = 'Child mortality'; value = [Math]::Round((Get-Num $row 'Contribution % 1.2'), 2) }
    )
    education = @(
      [ordered]@{ name = 'Years of schooling'; value = [Math]::Round((Get-Num $row 'Contribution % 2.1'), 2) }
      [ordered]@{ name = 'School attendance'; value = [Math]::Round((Get-Num $row 'Contribution % 2.2'), 2) }
    )
    livingStandards = @(
      [ordered]@{ name = 'Cooking fuel'; value = [Math]::Round((Get-Num $row 'Contribution % 3.1'), 2) }
      [ordered]@{ name = 'Sanitation'; value = [Math]::Round((Get-Num $row 'Contribution % 3.2'), 2) }
      [ordered]@{ name = 'Drinking water'; value = [Math]::Round((Get-Num $row 'Contribution % 3.3'), 2) }
      [ordered]@{ name = 'Electricity'; value = [Math]::Round((Get-Num $row 'Contribution % 3.4'), 2) }
      [ordered]@{ name = 'Housing'; value = [Math]::Round((Get-Num $row 'Contribution % 3.5'), 2) }
      [ordered]@{ name = 'Assets'; value = [Math]::Round((Get-Num $row 'Contribution % 3.6'), 2) }
    )
  }
}
function New-VulnerabilityComponents($row) {
  [ordered]@{
    environmental = [Math]::Round((Get-Num $row 'E'), 2)
    social = [Math]::Round((Get-Num $row 'S'), 2)
    climate = [Math]::Round((Get-Num $row 'C'), 2)
  }
}
function Get-AverageComponents($componentsList, [string[]]$keys) {
  $result = [ordered]@{}
  foreach ($key in $keys) {
    $result[$key] = [Math]::Round((($componentsList | ForEach-Object { $_.$key }) | Measure-Object -Average).Average, 2)
  }
  return $result
}
function Get-AverageContribution($componentsList, [string]$group, [string[]]$names) {
  $indicators = @()
  foreach ($name in $names) {
    $avg = (($componentsList | ForEach-Object { ($_.$group | Where-Object { $_.name -eq $name }).value }) | Measure-Object -Average).Average
    $indicators += [ordered]@{ name = $name; value = [Math]::Round($avg, 2) }
  }
  return $indicators
}
$gesiRows = Read-XlsxColumns $GesiWorkbook @('hh_municipality', 'hh_ward', 'b1_head_sex', 'b2_religion', 'b2_religion_other', 'b3_hh_type')
$shapefileRows = Import-Csv $ShapefileCsv
$spiRows | ForEach-Object { $_.Municipality = Get-CanonicalMunicipalityName $_.Municipality }
$gesiRows | ForEach-Object { $_.hh_municipality = Get-CanonicalMunicipalityName $_.hh_municipality }
$gesiByMunicipality = @{}
$gesiByWard = @{}
foreach ($row in $gesiRows) {
  $municipalityKey = Get-Key $row.hh_municipality
  if (-not $gesiByMunicipality.ContainsKey($municipalityKey)) { $gesiByMunicipality[$municipalityKey] = [System.Collections.Generic.List[object]]::new() }
  $gesiByMunicipality[$municipalityKey].Add($row)
  $wardKey = "$municipalityKey|$($row.hh_ward)"
  if (-not $gesiByWard.ContainsKey($wardKey)) { $gesiByWard[$wardKey] = [System.Collections.Generic.List[object]]::new() }
  $gesiByWard[$wardKey].Add($row)
}

$municipalities = @($spiRows | Group-Object Municipality | ForEach-Object {
  $name = $_.Name
  $municipalityKey = Get-Key $name
  $shapefileMunicipality = Resolve-ShapefileMunicipality $name $shapefileRows
  $households = if ($gesiByMunicipality.ContainsKey($municipalityKey)) { $gesiByMunicipality[$municipalityKey] } else { @() }
  $wards = @($_.Group | Sort-Object { [int]$_.Ward } | ForEach-Object {
    $wardKey = "$municipalityKey|$($_.Ward)"
    $wardHouseholds = if ($gesiByWard.ContainsKey($wardKey)) { $gesiByWard[$wardKey] } else { @() }
    [pscustomobject][ordered]@{
      id = "$municipalityKey-ward-$($_.Ward)"
      name = "Ward $($_.Ward)"
      wardNumber = [int]$_.Ward
      spiScore = [Math]::Round([double]$_.SPI, 2)
      exclusionIndex = [Math]::Round((Get-Num $_ 'EI'), 2)
      exclusionPercent = [Math]::Round((Get-Num $_ 'EI%'), 2)
      exclusionComponents = New-ExclusionComponents $_
      povertyIndex = [Math]::Round((Get-Num $_ 'MPI'), 3)
      povertyPercent = [Math]::Round((Get-Num $_ 'MPI%'), 2)
      povertyComponents = New-PovertyComponents $_
      vulnerabilityIndex = [Math]::Round((Get-Num $_ 'VI'), 2)
      vulnerabilityPercent = [Math]::Round((Get-Num $_ 'VI%'), 2)
      vulnerabilityComponents = New-VulnerabilityComponents $_
      gesi = New-Profile $wardHouseholds
    }
  })
  $exclusionKeys = @('socioEconomic', 'institutional', 'political', 'cultural', 'spatial')
  $vulnerabilityKeys = @('environmental', 'social', 'climate')
  [pscustomobject][ordered]@{
    id = $municipalityKey
    name = $name
    # Resolved one time from the ward shapefile's PALIKA and DISTRICT fields.
    mapPalika = if ($null -ne $shapefileMunicipality) { $shapefileMunicipality.palika } else { $name }
    district = if ($null -ne $shapefileMunicipality) { $shapefileMunicipality.district } else { 'Unknown' }
    overallSpi = [Math]::Round((($wards | Measure-Object spiScore -Average).Average), 2)
    exclusionIndex = [Math]::Round((($wards | Measure-Object exclusionIndex -Average).Average), 2)
    exclusionPercent = [Math]::Round((($wards | Measure-Object exclusionPercent -Average).Average), 2)
    exclusionComponents = Get-AverageComponents ($wards | ForEach-Object { $_.exclusionComponents }) $exclusionKeys
    povertyIndex = [Math]::Round((($wards | Measure-Object povertyIndex -Average).Average), 3)
    povertyPercent = [Math]::Round((($wards | Measure-Object povertyPercent -Average).Average), 2)
    povertyComponents = [ordered]@{
      headcountRatio = [Math]::Round((($wards | ForEach-Object { $_.povertyComponents.headcountRatio } | Measure-Object -Average).Average), 3)
      intensity = [Math]::Round((($wards | ForEach-Object { $_.povertyComponents.intensity } | Measure-Object -Average).Average), 3)
      health = Get-AverageContribution ($wards | ForEach-Object { $_.povertyComponents }) 'health' @('Nutrition', 'Child mortality')
      education = Get-AverageContribution ($wards | ForEach-Object { $_.povertyComponents }) 'education' @('Years of schooling', 'School attendance')
      livingStandards = Get-AverageContribution ($wards | ForEach-Object { $_.povertyComponents }) 'livingStandards' @('Cooking fuel', 'Sanitation', 'Drinking water', 'Electricity', 'Housing', 'Assets')
    }
    vulnerabilityIndex = [Math]::Round((($wards | Measure-Object vulnerabilityIndex -Average).Average), 2)
    vulnerabilityPercent = [Math]::Round((($wards | Measure-Object vulnerabilityPercent -Average).Average), 2)
    vulnerabilityComponents = Get-AverageComponents ($wards | ForEach-Object { $_.vulnerabilityComponents }) $vulnerabilityKeys
    wards = $wards
    gesi = New-Profile $households
  }
})

$folder = Split-Path -Parent $Output
if ($folder) { New-Item -ItemType Directory -Force -Path $folder | Out-Null }
@($municipalities) | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 $Output
Write-Host "Wrote $($municipalities.Count) municipalities to $Output"

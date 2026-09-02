$ErrorActionPreference='Stop'
$projectPath=Split-Path $PSScriptRoot -Parent
$catalog=@{}
foreach($language in @('english','russian','ukrainian')){
  $page=(Invoke-WebRequest -Uri "https://steamcommunity.com/stats/292030/achievements/?l=$language").Content
  $rows=[regex]::Matches($page,'(?s)<div class="achieveRow ">(.*?)<div style="clear: both;">')
  $result=@()
  foreach($row in $rows){
    $html=$row.Groups[1].Value
    $name=[System.Net.WebUtility]::HtmlDecode([regex]::Match($html,'(?s)<h3>(.*?)</h3>').Groups[1].Value).Trim()
    $description=[System.Net.WebUtility]::HtmlDecode([regex]::Match($html,'(?s)<h5>(.*?)</h5>').Groups[1].Value).Trim()
    $icon=[regex]::Match($html,'<img src="([^"]+)"').Groups[1].Value
    if($name){$result+=@{name=$name;description=$description;icon=$icon}}
  }
  if($result.Count -ne 78){throw "Expected 78 achievements, got $($result.Count) for $language"}
  $catalog[$language]=$result
}
$records=@()
foreach($entry in $catalog.english){
 $ru=$catalog.russian | Where-Object {$_.icon -eq $entry.icon} | Select-Object -First 1
 $uk=$catalog.ukrainian | Where-Object {$_.icon -eq $entry.icon} | Select-Object -First 1
 if(!$ru -or !$uk){throw 'Localized catalog identity mismatch'}
 $id=($entry.name.ToLowerInvariant() -replace '[^a-z0-9]+','-').Trim('-')
 $records+=@{id=$id;name=@{en=$entry.name;ru=$ru.name;uk=$uk.name};description=@{en=$entry.description;ru=$ru.description;uk=$uk.description};icon=$entry.icon;secret=($entry.description.Length -eq 0)}
}
$records | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 (Join-Path $projectPath 'lib/witcher-steam.json')
$details=Invoke-RestMethod 'https://store.steampowered.com/api/appdetails?appids=292030&l=english'
$data=$details.'292030'.data
if(!$data.header_image){throw 'No official header image'}
Invoke-WebRequest $data.header_image -OutFile (Join-Path $projectPath 'public/witcher-cover.jpg')
if($data.screenshots.Count -gt 0){Invoke-WebRequest $data.screenshots[0].path_full -OutFile (Join-Path $projectPath 'public/witcher-landscape.jpg')}
Write-Output "Saved $($records.Count) achievements, three Steam languages and official artwork."

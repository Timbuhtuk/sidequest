$ErrorActionPreference='Stop'
$plans=@(
    @{Title='GARM 02.png';Id='garm-raw'},
    @{Title='Dubai raw 04.png';Id='dubai-raw'},
    @{Title='London 02.png';Id='london-raw'},
    @{Title='Throat 03.png';Id='throat-raw'},
    @{Title='Ridit station 02.png';Id='ridit-raw'},
    @{Title='Praha overmap flat 02.png';Id='prague-raw'},
    @{Title='Palisade Bank 02.png';Id='bank-raw'},
    @{Title='TF29 01.png';Id='tf29-raw'},
    @{Title='Zelen apts 01.png';Id='zelen-raw'},
    @{Title='RVAC Row 02.png';Id='rvac-raw'},
    @{Title='Stedry 02.png';Id='stedry-raw'},
    @{Title='The Time Machine 01.png';Id='koller-raw'}
)
New-Item -ItemType Directory -Force 'public/maps/plans' | Out-Null
$manifest=@()
foreach($plan in $plans)
{
    $uri='https://deusex.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&format=json&titles='+[uri]::EscapeDataString('File:'+$plan.Title)
    $response=Invoke-RestMethod -Uri $uri
    $info=$response.query.pages.PSObject.Properties.Value.imageinfo[0]
    if(-not $info.url){throw "Missing image: $($plan.Title)"}
    Invoke-WebRequest -Uri $info.url -OutFile "public/maps/plans/$($plan.Id).png"
    $manifest+=@{id=$plan.Id;title=$plan.Title;url=$info.url;page=$info.descriptionurl;width=$info.width;height=$info.height;metadata=$info.extmetadata}
    Write-Output "$($plan.Id): $($info.width) x $($info.height)"
}
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 'public/maps/plans/sources.json'

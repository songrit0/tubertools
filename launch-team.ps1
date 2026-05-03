# Claude Code Agent Team Launcher — 12vtuber (vtuber-tools)
param()

$PROJECT = "C:\Users\MARU\12vtuber"
$CLAUDE  = "C:\Users\MARU\.local\bin\claude.exe"

# Team 1: Dev Team — general feature work
$t1agents = @{}
$t1agents["planner"]  = @{ description = "Plans features: breaks tasks into steps, flags risks, checks navigation impact"; prompt = "You plan implementations for the vtuber-tools Expo/React Native app. Present step-by-step plans and get approval before executing. Always check screens/, navigation/, and services/ when scoping work." }
$t1agents["coder"]    = @{ description = "Implements screens, components, and service calls per the plan"; prompt = "You implement code changes in the vtuber-tools project. Follow the plan exactly. Keep components in components/, screens in screens/, Firebase logic in services/. Write minimal, correct code." }
$t1agents["reviewer"] = @{ description = "Reviews diffs for bugs, security, and React Native best practices"; prompt = "You review code changes in the vtuber-tools project for correctness, security (especially Firebase rules and auth), and React Native / Expo compatibility." }

# Team 2: Firebase Team — backend & data layer
$t2agents = @{}
$t2agents["rules-auditor"]  = @{ description = "Audits FIREBASE_RULES.md and firebase.json for security gaps"; prompt = "You audit Firebase security rules in FIREBASE_RULES.md and firebase.json. Flag any rules that are too permissive, missing auth checks, or inconsistent with the app's auth flow in services/authService.js." }
$t2agents["service-dev"]    = @{ description = "Develops and refactors Firestore service functions in services/"; prompt = "You develop Firebase/Firestore service functions in services/. Keep firebaseConfig.js clean, add proper error handling, and ensure all DB calls are in service files — not scattered in screens." }
$t2agents["data-modeler"]   = @{ description = "Designs and documents Firestore data models and indexes"; prompt = "You design Firestore collections, document schemas, and index requirements for the vtuber-tools app. Document decisions in comments or FIREBASE_RULES.md." }

# Team 3: Game Team — mini-game development
$t3agents = @{}
$t3agents["game-logic"]  = @{ description = "Implements game rules for Quiz, Monopoly, and GourdCrab games"; prompt = "You implement game logic for the vtuber-tools mini-games: Quiz (screens/QuizScreen.js), Monopoly (games/monopoly/, services/monopolyService.js), and GourdCrab (games/gourdcrab/). Keep game rules pure and separated from UI." }
$t3agents["game-ui"]     = @{ description = "Builds and polishes game screen UIs and animations"; prompt = "You build UI for the vtuber-tools mini-game screens. Use StyleSheet, react-native-svg, and the project theme in theme/. Keep assets in assets/." }
$t3agents["game-tester"] = @{ description = "Tests game flows end-to-end, checks edge cases and score logic"; prompt = "You test the mini-game flows in the vtuber-tools app. Walk through each game path (start → play → result → replay), flag bugs in game logic, and check ResultScreen.js result handling." }

# Team 4: VTuber Content Team — VTuber data and selection UX
$t4agents = @{}
$t4agents["content-curator"] = @{ description = "Manages VTuber data schema and vtuberDatabaseService.js"; prompt = "You manage VTuber data in services/vtuberDatabaseService.js and data/. Ensure the schema is consistent, all required fields are present, and data/ files match the Firestore structure." }
$t4agents["ux-designer"]     = @{ description = "Improves VTuber selection UX across SelectVTuberScreen, SelectionModal, and related screens"; prompt = "You improve the VTuber selection experience in screens/SelectVTuberScreen.js, screens/VTuberSelectionScreen.js, components/SelectionModal.js, and components/SelectionPreviewModal.js. Focus on usability and consistency." }

# Team 5: Admin & Deploy Team
$t5agents = @{}
$t5agents["admin-dev"]   = @{ description = "Develops AdminDataScreen and admin/ panel features"; prompt = "You develop the admin panel in screens/AdminDataScreen.js and screens/admin/. Ensure admin routes are properly protected by auth in services/authService.js." }
$t5agents["build-ops"]   = @{ description = "Manages expo export, firebase deploy, and web build pipeline"; prompt = "You manage the build and deploy pipeline for the vtuber-tools app. Reference package.json scripts (build:web, deploy). Check dist/, public/, and firebase.json. Never push secrets." }

$TEAMS = [ordered]@{}
$TEAMS["1"] = @{ name = "Dev Team";           desc = "Planner + Coder + Reviewer";               agents = $t1agents }
$TEAMS["2"] = @{ name = "Firebase Team";      desc = "Rules auditor + Service dev + Data modeler"; agents = $t2agents }
$TEAMS["3"] = @{ name = "Game Team";          desc = "Game logic + Game UI + Game tester";        agents = $t3agents }
$TEAMS["4"] = @{ name = "VTuber Content Team"; desc = "Content curator + UX designer";            agents = $t4agents }
$TEAMS["5"] = @{ name = "Admin & Deploy Team"; desc = "Admin dev + Build ops";                    agents = $t5agents }
$TEAMS["6"] = @{ name = "Custom Team";         desc = "Define your own agents interactively";     agents = $null }

# UI
Clear-Host
Write-Host ""
Write-Host "  +--------------------------------------------------+" -ForegroundColor Magenta
Write-Host "  |   Claude Code -- Agent Team Launcher             |" -ForegroundColor Magenta
Write-Host "  |   Project: vtuber-tools (12vtuber)               |" -ForegroundColor Magenta
Write-Host "  +--------------------------------------------------+" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Select a team to spawn:" -ForegroundColor White
Write-Host ""

foreach ($key in $TEAMS.Keys) {
    $t = $TEAMS[$key]
    $agentList = if ($t.agents) { $t.agents.Keys -join ", " } else { "interactive" }
    Write-Host "  [$key] " -ForegroundColor Yellow -NoNewline
    Write-Host "$($t.name)" -ForegroundColor White -NoNewline
    Write-Host "  ($($t.desc))" -ForegroundColor DarkGray
    Write-Host "       Agents: $agentList" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "  [Q] Quit" -ForegroundColor DarkGray
Write-Host ""
$choice = Read-Host "  Enter choice"

if ($choice -ieq "Q") { exit 0 }

if (-not $TEAMS.Contains($choice)) {
    Write-Host "  Invalid choice." -ForegroundColor Red
    Start-Sleep 2
    exit 1
}

$selected = $TEAMS[$choice]

# Custom team builder
if ($choice -eq "6") {
    Write-Host ""
    Write-Host "  Custom Team Builder" -ForegroundColor Cyan
    Write-Host "  Add agents one by one. Enter blank name when done." -ForegroundColor DarkGray
    Write-Host ""
    $customAgents = @{}
    $idx = 1
    while ($true) {
        $aname = Read-Host "  Agent $idx name (blank = done)"
        if ([string]::IsNullOrWhiteSpace($aname)) { break }
        $adesc   = Read-Host "  $aname -- short description"
        $aprompt = Read-Host "  $aname -- system prompt"
        $customAgents[$aname] = @{ description = $adesc; prompt = $aprompt }
        $idx++
    }
    if ($customAgents.Count -eq 0) {
        Write-Host "  No agents defined. Exiting." -ForegroundColor Red
        Start-Sleep 2
        exit 1
    }
    $selected = @{
        name   = "Custom Team"
        desc   = "$($customAgents.Count) agents"
        agents = $customAgents
    }
}

# Build --agents JSON and launch
$agentsJson = $selected.agents | ConvertTo-Json -Depth 5 -Compress

Write-Host ""
Write-Host "  Spawning: $($selected.name)" -ForegroundColor Green
Write-Host "  Agents  : $($selected.agents.Keys -join ', ')" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Starting Claude Code in $PROJECT ..." -ForegroundColor DarkGray
Write-Host ""

Set-Location $PROJECT
& $CLAUDE --agents $agentsJson

package com.clashiq.nativeapp

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val FeatureBg = Color(0xFF070A10)
private val FeatureCard = Color(0xFF111722)
private val FeatureGold = Color(0xFFFFC54D)
private val FeatureMuted = Color(0xFF8D98A8)
private val FeatureWhite = Color(0xFFF7F4EC)
private val FeatureBlue = Color(0xFF48B9F4)
private val FeatureGreen = Color(0xFF45D17B)

@Composable
fun FullFeatureScreen(page: String, onNavigate: (String) -> Unit = {}) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 15.dp, vertical = 8.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("CLASH IQ  /  COMMAND CENTER", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
                Spacer(Modifier.height(4.dp))
                Text(page, color = FeatureWhite, fontSize = 23.sp, fontWeight = FontWeight.Black)
            }
            Text("✦", color = FeatureGold, fontSize = 23.sp)
        }
        Spacer(Modifier.height(14.dp))
        when (page) {
            "War Center" -> WarScreenContent()
            "War Planner" -> PlannerScreenContent()
            "Clan Overview" -> ClanScreenContent()
            "Capital Raid" -> CapitalScreenContent()
            "War Log" -> LogScreenContent()
            "Progress Tracker" -> ProgressScreenContent()
            "Members" -> MembersScreenContent()
            "Settings" -> SettingsScreenContent()
            "YouTube & Playlist" -> YouTubePlaylistScreenContent()
            "Widget Preview" -> WidgetScreenContent()
            else -> MoreScreenContent(onNavigate)
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun FeatureHero(title: String, subtitle: String, symbol: String, color: Color = FeatureGold) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp))
        .background(Brush.linearGradient(listOf(Color(0xFF26364C), Color(0xFF171D29), Color(0xFF17151B))))
        .border(1.dp, color.copy(alpha = .35f), RoundedCornerShape(20.dp)).padding(16.dp)) {
        Text(symbol, color = color, fontSize = 31.sp)
        Spacer(Modifier.height(9.dp))
        Text(title, color = FeatureWhite, fontSize = 17.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(5.dp))
        Text(subtitle, color = FeatureMuted, fontSize = 11.sp)
    }
}

@Composable
private fun FeatureRow(title: String, detail: String, metric: String, accent: Color = FeatureGold) {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(FeatureCard)
        .border(1.dp, Color.White.copy(alpha = .05f), RoundedCornerShape(15.dp)).padding(13.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(37.dp).clip(RoundedCornerShape(11.dp)).background(accent.copy(alpha = .12f)), contentAlignment = Alignment.Center) {
            Text("✦", color = accent, fontSize = 17.sp)
        }
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = FeatureWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(3.dp))
            Text(detail, color = FeatureMuted, fontSize = 9.sp)
        }
        Text(metric, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun WarScreenContent() {
    FeatureHero("LIVE WAR", "Battle overview · Preparation and attack status", "⚔", Color(0xFFFF7C9A))
    Spacer(Modifier.height(11.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FeatureMetric("42", "OUR STARS", FeatureGold, Modifier.weight(1f))
        FeatureMetric("38", "ENEMY STARS", FeatureWhite, Modifier.weight(1f))
        FeatureMetric("21/30", "ATTACKS", FeatureGreen, Modifier.weight(1f))
    }
    Spacer(Modifier.height(12.dp))
    Text("ATTACK LINEUP", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.4.sp)
    Spacer(Modifier.height(8.dp))
    listOf("Mecka" to "100%", "KingPatrik" to "100%", "DarkRider" to "83%", "Shadow" to "67%").forEach {
        FeatureRow(it.first, "Attack performance", it.second, FeatureGreen)
        Spacer(Modifier.height(7.dp))
    }
}

@Composable
private fun PlannerScreenContent() {
    FeatureHero("TACTICAL MAP", "Plan targets and coordinate clan attacks", "▧", FeatureBlue)
    Spacer(Modifier.height(12.dp))
    Box(Modifier.fillMaxWidth().height(210.dp).clip(RoundedCornerShape(19.dp))
        .background(Brush.radialGradient(listOf(Color(0xFF625333), Color(0xFF29364A), Color(0xFF121722))))
        .border(1.dp, FeatureGold.copy(alpha = .35f), RoundedCornerShape(19.dp)), contentAlignment = Alignment.Center) {
        Box(Modifier.size(145.dp).clip(RoundedCornerShape(23.dp)).background(Color(0xFF5C654B)).border(2.dp, FeatureGold, RoundedCornerShape(23.dp)), contentAlignment = Alignment.Center) {
            Text("⌂", color = Color(0xFFE3D9B4), fontSize = 68.sp)
        }
        listOf("1", "2", "3", "4").forEachIndexed { index, value ->
            Box(Modifier.offset(x = listOf((-78).dp, 75.dp, (-72).dp, 78.dp)[index], y = listOf((-65).dp, (-58).dp, 61.dp, 62.dp)[index])
                .size(27.dp).clip(CircleShape).background(if (index == 2) FeatureGold else FeatureBlue), contentAlignment = Alignment.Center) {
                Text(value, color = FeatureBg, fontSize = 11.sp, fontWeight = FontWeight.Black)
            }
        }
    }
    Spacer(Modifier.height(12.dp))
    FeatureRow("Target #3 · TH16", "Enemy base · Assigned for review", "VIEW")
    Spacer(Modifier.height(10.dp))
    FeatureAction("Generate AI Plan")
}

@Composable
private fun ClanScreenContent() {
    FeatureHero("BHABE DHEMONS", "#2Q0Q82C9R · Clan overview and performance", "♜")
    Spacer(Modifier.height(11.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FeatureMetric("48/50", "MEMBERS", FeatureGreen, Modifier.weight(1f))
        FeatureMetric("5 234", "TROPHIES", FeatureGold, Modifier.weight(1f))
        FeatureMetric("Crystal I", "CWL", Color(0xFFE77AD0), Modifier.weight(1f))
    }
    Spacer(Modifier.height(15.dp))
    Text("WAR RECORD", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.3.sp)
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FeatureMetric("186", "WINS", FeatureGreen, Modifier.weight(1f))
        FeatureMetric("92", "LOSSES", Color(0xFFFF7770), Modifier.weight(1f))
        FeatureMetric("67%", "WIN RATE", FeatureBlue, Modifier.weight(1f))
    }
    Spacer(Modifier.height(13.dp))
    listOf("Recent war vs Shadow Legends" to "42 – 38 · Win", "vs Dark Empire" to "37 – 41 · Loss", "vs Nordic Clash" to "44 – 33 · Win").forEach {
        FeatureRow(it.first, "Clan war result", it.second)
        Spacer(Modifier.height(7.dp))
    }
}

@Composable
private fun CapitalScreenContent() {
    FeatureHero("RAID WEEKEND", "Capital Hall 10 · Season overview", "♜", FeatureGold)
    Spacer(Modifier.height(12.dp))
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(17.dp)).background(FeatureCard).padding(15.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("CAPITAL PROGRESS", color = FeatureMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Text("8 432 / 10 000", color = FeatureGold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(9.dp))
        Box(Modifier.fillMaxWidth().height(9.dp).clip(CircleShape).background(Color(0xFF29313C))) {
            Box(Modifier.fillMaxWidth(.843f).fillMaxHeight().clip(CircleShape).background(Brush.horizontalGradient(listOf(Color(0xFF9E742D), FeatureGold))))
        }
    }
    Spacer(Modifier.height(11.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FeatureMetric("1 234", "RAID MEDALS", FeatureGold, Modifier.weight(1f))
        FeatureMetric("6/6", "ATTACKS", FeatureBlue, Modifier.weight(1f))
    }
    Spacer(Modifier.height(14.dp))
    listOf("Dragon Cliffs" to "96%", "Barbarian Camp" to "100%", "Wizard Valley" to "82%", "Skeleton Park" to "78%").forEach {
        FeatureRow(it.first, "Recent raid result", it.second, FeatureGreen)
        Spacer(Modifier.height(7.dp))
    }
}

@Composable
private fun LogScreenContent() {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FeatureMetric("186", "WINS", FeatureGreen, Modifier.weight(1f))
        FeatureMetric("92", "LOSSES", Color(0xFFFF7770), Modifier.weight(1f))
        FeatureMetric("67%", "WIN RATE", FeatureBlue, Modifier.weight(1f))
    }
    Spacer(Modifier.height(13.dp))
    listOf("Shadow Legends" to "42 – 38 · WIN", "Dark Empire" to "37 – 41 · LOSS", "Nordic Clash" to "44 – 33 · WIN", "Iron Wolves" to "39 – 36 · WIN").forEach {
        FeatureRow("vs " + it.first, "Recent clan war", it.second, if (it.second.contains("WIN")) FeatureGreen else Color(0xFFFF7770))
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun ProgressScreenContent() {
    FeatureHero("UPGRADE JOURNEY", "Track buildings, heroes and troops", "↗")
    Spacer(Modifier.height(13.dp))
    listOf("Buildings" to .72f, "Heroes" to .84f, "Troops" to .61f, "Spells" to .57f).forEach { pair ->
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(FeatureCard).padding(13.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(pair.first, color = FeatureWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text((pair.second * 100).toInt().toString() + "%", color = FeatureGold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Box(Modifier.fillMaxWidth().height(7.dp).clip(CircleShape).background(Color(0xFF29313C))) {
                Box(Modifier.fillMaxWidth(pair.second).fillMaxHeight().clip(CircleShape).background(Brush.horizontalGradient(listOf(Color(0xFF9E742D), FeatureGold))))
            }
        }
        Spacer(Modifier.height(8.dp))
    }
    FeatureRow("Next upgrade", "Choose a building or troop to track", "＋")
}

@Composable
private fun MembersScreenContent() {
    FeatureHero("CLAN ROSTER", "Members, roles and war participation", "♟", FeatureBlue)
    Spacer(Modifier.height(12.dp))
    listOf("Mecka" to "TH17 · Leader", "KingPatrik" to "TH16 · Co-leader", "DarkRider" to "TH16 · Elder", "Shadow" to "TH15 · Member", "Ragnar" to "TH15 · Member").forEachIndexed { i, pair ->
        FeatureRow(pair.first, pair.second, if (i == 0) "♛" else "TH", if (i == 0) FeatureGold else FeatureBlue)
        Spacer(Modifier.height(7.dp))
    }
}

@Composable
private fun SettingsScreenContent() {
    listOf("Active clan" to "BHABE DHEMONS", "Appearance" to "Dark · Gold", "Notifications" to "War and clan updates", "Data refresh" to "Refresh preferences", "Account" to "Sign-in and profile").forEach {
        FeatureRow(it.first, it.second, "›")
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun MoreScreenContent(onNavigate: (String) -> Unit) {
    listOf("War Planner", "Clan Overview", "Capital Raid", "War Log", "Progress Tracker", "YouTube & Playlist", "Widget Preview", "Settings").forEach { name ->
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(FeatureCard).clickable { onNavigate(name) }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("✦", color = FeatureGold, fontSize = 20.sp)
            Spacer(Modifier.width(12.dp))
            Text(name, color = FeatureWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.weight(1f))
            Text("›", color = FeatureGold, fontSize = 22.sp)
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun FeatureMetric(value: String, label: String, tint: Color, modifier: Modifier) {
    Column(modifier.clip(RoundedCornerShape(14.dp)).background(FeatureCard).border(1.dp, Color.White.copy(alpha = .05f), RoundedCornerShape(14.dp)).padding(11.dp)) {
        Text(value, color = tint, fontSize = 16.sp, fontWeight = FontWeight.Black, maxLines = 1)
        Spacer(Modifier.height(5.dp))
        Text(label, color = FeatureMuted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .5.sp)
    }
}

@Composable
private fun FeatureAction(label: String) {
    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).background(Brush.horizontalGradient(listOf(Color(0xFF9E742D), FeatureGold))).clickable { }.padding(vertical = 14.dp), contentAlignment = Alignment.Center) {
        Text(label + "  ›", color = FeatureBg, fontSize = 12.sp, fontWeight = FontWeight.Black)
    }
}


@Composable
private fun YouTubePlaylistScreenContent() {
    var tracks by remember { mutableStateOf(listOf("War preparation mix", "Focus and farming", "Clan favorites")) }
    var newTrack by remember { mutableStateOf("") }
    FeatureHero("CLAN MEDIA", "YouTube and one shared clan playlist", "▶", Color(0xFFFF5757))
    Spacer(Modifier.height(12.dp))
    Text("YOUTUBE", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.3.sp)
    Spacer(Modifier.height(8.dp))
    Box(Modifier.fillMaxWidth().height(155.dp).clip(RoundedCornerShape(18.dp))
        .background(Brush.linearGradient(listOf(Color(0xFF29364A), Color(0xFF121722))))
        .border(1.dp, Color(0xFFFF5757).copy(alpha = .35f), RoundedCornerShape(18.dp)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("▶", color = Color(0xFFFF5757), fontSize = 36.sp)
            Spacer(Modifier.height(7.dp))
            Text("YouTube video area", color = FeatureWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text("Video search and playback connection pending", color = FeatureMuted, fontSize = 9.sp)
        }
    }
    Spacer(Modifier.height(16.dp))
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("SHARED CLAN PLAYLIST", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
            Text("${tracks.size} items · Add or remove", color = FeatureMuted, fontSize = 10.sp)
        }
    }
    Spacer(Modifier.height(8.dp))
    tracks.forEachIndexed { index, track ->
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(FeatureCard).padding(horizontal = 12.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("♫", color = Color(0xFF53D18B), fontSize = 18.sp)
            Spacer(Modifier.width(10.dp))
            Text(track, color = FeatureWhite, fontSize = 11.sp, modifier = Modifier.weight(1f))
            Text("×", color = Color(0xFFFF7770), fontSize = 21.sp, modifier = Modifier.clickable { tracks = tracks.filterIndexed { i, _ -> i != index } }.padding(horizontal = 7.dp))
        }
        Spacer(Modifier.height(6.dp))
    }
    OutlinedTextField(
        value = newTrack,
        onValueChange = { newTrack = it },
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("Add a song or playlist link", color = FeatureMuted, fontSize = 11.sp) },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = FeatureWhite, unfocusedTextColor = FeatureWhite,
            focusedBorderColor = FeatureGold, unfocusedBorderColor = FeatureMuted.copy(alpha = .5f),
            cursorColor = FeatureGold
        )
    )
    Spacer(Modifier.height(8.dp))
    FeatureAction("Add to shared playlist")
    Box(Modifier.fillMaxWidth().clickable {
        if (newTrack.isNotBlank()) {
            tracks = tracks + newTrack.trim()
            newTrack = ""
        }
    }.padding(vertical = 12.dp), contentAlignment = Alignment.Center) {
        Text("＋ Add item", color = FeatureGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
    Text("Preview only: changes are local to this screen. Shared syncing and YouTube integration are not connected yet.", color = FeatureMuted, fontSize = 9.sp)
}

@Composable
private fun WidgetScreenContent() {
    FeatureHero("AT A GLANCE", "A home-screen widget for your clan status", "▦", FeatureBlue)
    Spacer(Modifier.height(12.dp))
    Text("WIDGET PREVIEW", color = FeatureGold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.3.sp)
    Spacer(Modifier.height(8.dp))
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp))
        .background(Brush.verticalGradient(listOf(Color(0xFF202D40), Color(0xFF111722))))
        .border(1.dp, FeatureGold.copy(alpha = .45f), RoundedCornerShape(22.dp)).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("♜", color = FeatureGold, fontSize = 25.sp)
            Spacer(Modifier.width(9.dp))
            Column(Modifier.weight(1f)) {
                Text("BHABE DHEMONS", color = FeatureWhite, fontSize = 12.sp, fontWeight = FontWeight.Black)
                Text("Clan status · Example data", color = FeatureMuted, fontSize = 9.sp)
            }
            Text("✦", color = FeatureGold, fontSize = 18.sp)
        }
        Spacer(Modifier.height(15.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FeatureMetric("42–38", "WAR SCORE", FeatureGold, Modifier.weight(1f))
            FeatureMetric("21/30", "ATTACKS", FeatureBlue, Modifier.weight(1f))
            FeatureMetric("48/50", "MEMBERS", FeatureGreen, Modifier.weight(1f))
        }
        Spacer(Modifier.height(12.dp))
        Text("Updated just now · Widget appearance concept", color = FeatureMuted, fontSize = 9.sp)
    }
    Spacer(Modifier.height(10.dp))
    Text("This is a visual preview, not an installed Android home-screen widget yet.", color = FeatureMuted, fontSize = 10.sp)
}

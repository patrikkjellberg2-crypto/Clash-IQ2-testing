package com.clashiq.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Night = Color(0xFF070A10)
private val Card = Color(0xFF111722)
private val Card2 = Color(0xFF182231)
private val Gold = Color(0xFFFFC54D)
private val GoldDim = Color(0xFF9E742D)
private val TextMain = Color(0xFFF7F4EC)
private val TextMuted = Color(0xFF8D98A8)
private val Blue = Color(0xFF48B9F4)
private val Green = Color(0xFF45D17B)
private val Pink = Color(0xFFE77AD0)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { ClashIqApp() } }
    }
}

@Composable
private fun ClashIqApp() {
    var tab by remember { mutableStateOf("Home") }
    var menuOpen by remember { mutableStateOf(false) }
    Surface(Modifier.fillMaxSize(), color = Night) {
        Column(Modifier.fillMaxSize()) {
            if (menuOpen) {
                SideMenu(onClose = { menuOpen = false }, onSelect = { tab = it; menuOpen = false })
            } else {
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                    AppHeader(onMenu = { menuOpen = true })
                    when (tab) {
                        "Home" -> Dashboard(onNavigate = { tab = it })
                        "War" -> FullFeatureScreen("War Center")
                        "AI Coach" -> AiCoachPage()
                        "Members" -> FullFeatureScreen("Members")
                        "War Planner", "Clan Overview", "Capital Raid", "War Log", "Progress Tracker", "Settings", "YouTube & Playlist", "Widget Preview" -> FullFeatureScreen(tab)
                        else -> FullFeatureScreen("More tools") { tab = it }
                    }
                }
                BottomNavigation(tab) { tab = it }
            }
        }
    }
}

@Composable
private fun AppHeader(onMenu: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(start = 18.dp, end = 18.dp, top = 14.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("♛", color = Gold, fontSize = 27.sp)
        Spacer(Modifier.width(8.dp))
        Text("Clash IQ", color = TextMain, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.weight(1f))
        Text("✦", color = Gold, fontSize = 18.sp)
        Spacer(Modifier.width(16.dp))
        TextButton(onClick = onMenu, contentPadding = PaddingValues(0.dp)) { Text("☷", color = Gold, fontSize = 24.sp) }
    }
}

@Composable
private fun Dashboard(onNavigate: (String) -> Unit) {
    Column(Modifier.padding(horizontal = 14.dp)) {
        ClanBanner()
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile("🏆", "5 234", "Trophies", Modifier.weight(1f), Gold)
            StatTile("♟", "48/50", "Members", Modifier.weight(1f), TextMain)
            StatTile("✦", "Crystal I", "CWL League", Modifier.weight(1f), Pink)
        }
        Spacer(Modifier.height(12.dp))
        val shortcuts = listOf(
            Triple("⚔", "War", Gold), Triple("✦", "AI Coach", Blue),
            Triple("▧", "War Planner", Pink), Triple("♜", "Capital Raid", Gold)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            shortcuts.forEach { (icon, label, tint) ->
                Shortcut(icon, label, tint, Modifier.weight(1f)) { onNavigate(label) }
            }
        }
        Spacer(Modifier.height(18.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Recent War", color = TextMain, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.weight(1f))
            Text("View all  →", color = Blue, fontSize = 11.sp, modifier = Modifier.clickable { onNavigate("War Log") })
        }
        Spacer(Modifier.height(9.dp))
        RecentWarCard()
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Clan intelligence", color = TextMain, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.weight(1f))
            Text("Overview", color = TextMuted, fontSize = 10.sp, modifier = Modifier.clickable { onNavigate("Clan Overview") })
        }
        Spacer(Modifier.height(9.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MiniPanel("WAR RECORD", "186", "Wins", Green, Modifier.weight(1f))
            MiniPanel("WAR RECORD", "92", "Losses", Color(0xFFFF6B66), Modifier.weight(1f))
            MiniPanel("WIN RATE", "67%", "All-time", Blue, Modifier.weight(1f))
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun ClanBanner() {
    Box(
        Modifier.fillMaxWidth().height(154.dp).clip(RoundedCornerShape(20.dp))
            .background(Brush.verticalGradient(listOf(Color(0xFF344056), Color(0xFF1A2638), Color(0xFF101722))))
            .border(1.dp, GoldDim.copy(alpha = .7f), RoundedCornerShape(20.dp))
    ) {
        // Atmospheric layered shapes stand in until the approved barbarian artwork is added.
        Box(Modifier.fillMaxWidth().height(70.dp).align(Alignment.TopCenter).background(Brush.horizontalGradient(listOf(Color.Transparent, Gold.copy(alpha = .16f), Color.Transparent))))
        Column(Modifier.align(Alignment.CenterStart).padding(15.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(45.dp).clip(RoundedCornerShape(13.dp)).background(Brush.linearGradient(listOf(Color(0xFF8E2834), Color(0xFF39151D)))).border(1.dp, Gold, RoundedCornerShape(13.dp)), contentAlignment = Alignment.Center) {
                    Text("♜", color = Gold, fontSize = 24.sp)
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text("BHABE DHEMONS", color = TextMain, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = .4.sp)
                    Text("#2Q0Q82C9R", color = TextMuted, fontSize = 10.sp)
                }
            }
            Spacer(Modifier.height(18.dp))
            Text("YOUR CLAN. YOUR WAR. YOUR IQ.", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.3.sp)
        }
        Box(Modifier.align(Alignment.CenterEnd).padding(end = 17.dp).size(38.dp).clip(RoundedCornerShape(12.dp)).background(Color.Black.copy(alpha = .32f)), contentAlignment = Alignment.Center) {
            Text("⌄", color = TextMain, fontSize = 20.sp)
        }
    }
}

@Composable
private fun StatTile(icon: String, value: String, label: String, modifier: Modifier, tint: Color) {
    Column(modifier.clip(RoundedCornerShape(15.dp)).background(Card).border(1.dp, Color.White.copy(alpha = .055f), RoundedCornerShape(15.dp)).padding(vertical = 12.dp, horizontal = 7.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(icon, color = tint, fontSize = 17.sp)
        Spacer(Modifier.height(5.dp))
        Text(value, color = TextMain, fontSize = 13.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(3.dp))
        Text(label, color = TextMuted, fontSize = 9.sp, maxLines = 1)
    }
}

@Composable
private fun Shortcut(icon: String, label: String, tint: Color, modifier: Modifier, onClick: () -> Unit) {
    Column(modifier.clickable(onClick = onClick).height(76.dp).clip(RoundedCornerShape(15.dp)).background(Brush.verticalGradient(listOf(Card2, Card))).border(1.dp, tint.copy(alpha = .18f), RoundedCornerShape(15.dp)).padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(icon, color = tint, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(5.dp))
        Text(label, color = TextMain, fontSize = 9.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun RecentWarCard() {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(17.dp)).background(Card).border(1.dp, Color.White.copy(alpha = .06f), RoundedCornerShape(17.dp)).padding(13.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("♜", color = Gold, fontSize = 22.sp)
                Spacer(Modifier.width(7.dp))
                Column {
                    Text("BHABE DHEMONS", color = TextMain, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Text("Recent clan war", color = TextMuted, fontSize = 9.sp)
                }
            }
            Text("VICTORY", color = Green, fontSize = 9.sp, fontWeight = FontWeight.Black)
        }
        Spacer(Modifier.height(11.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            Text("42", color = TextMain, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.width(10.dp))
            Text("★", color = Gold, fontSize = 14.sp)
            Spacer(Modifier.width(10.dp))
            Text("38", color = TextMain, fontSize = 25.sp, fontWeight = FontWeight.Black)
        }
        Spacer(Modifier.height(9.dp))
        Box(Modifier.fillMaxWidth().height(5.dp).clip(CircleShape).background(Color(0xFF743B3A))) {
            Box(Modifier.fillMaxWidth(.53f).fillMaxHeight().clip(CircleShape).background(Brush.horizontalGradient(listOf(GoldDim, Gold))))
        }
    }
}

@Composable
private fun MiniPanel(title: String, value: String, label: String, tint: Color, modifier: Modifier) {
    Column(modifier.clip(RoundedCornerShape(14.dp)).background(Card).padding(11.dp)) {
        Text(title, color = TextMuted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .5.sp)
        Spacer(Modifier.height(7.dp))
        Text(value, color = tint, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Text(label, color = TextMuted, fontSize = 9.sp)
    }
}

@Composable
private fun FeaturePage(kicker: String, title: String, symbol: String, note: String) {
    Column(Modifier.fillMaxWidth().padding(18.dp)) {
        Text(kicker, color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
        Spacer(Modifier.height(5.dp))
        Text(title, color = TextMain, fontSize = 23.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(18.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(Brush.verticalGradient(listOf(Card2, Card))).border(1.dp, GoldDim.copy(alpha = .4f), RoundedCornerShape(22.dp)).padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(symbol, color = Gold, fontSize = 42.sp)
            Spacer(Modifier.height(14.dp))
            Text(title, color = TextMain, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(7.dp))
            Text(note, color = TextMuted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun SideMenu(onClose: () -> Unit, onSelect: (String) -> Unit) {
    Column(Modifier.fillMaxSize().background(Night).padding(18.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("♛", color = Gold, fontSize = 26.sp)
            Spacer(Modifier.width(9.dp))
            Column(Modifier.weight(1f)) {
                Text("Clash IQ", color = TextMain, fontSize = 18.sp, fontWeight = FontWeight.Black)
                Text("Premium", color = TextMuted, fontSize = 10.sp)
            }
            TextButton(onClick = onClose) { Text("×", color = TextMuted, fontSize = 25.sp) }
        }
        Spacer(Modifier.height(22.dp))
        listOf("Home", "War", "War Planner", "AI Coach", "Members", "Capital Raid", "War Log", "Progress Tracker", "Settings").forEach { item ->
            val destination = item
            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp).clip(RoundedCornerShape(12.dp)).clickable { onSelect(destination) }.background(if (item == "Home") Color(0xFF382D18) else Card).border(if (item == "Home") 1.dp else 0.dp, GoldDim.copy(alpha = .7f), RoundedCornerShape(12.dp)).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(when (item) { "Home" -> "▦"; "War" -> "⚔"; "AI Coach" -> "✦"; "Members" -> "♟"; else -> "◇" }, color = Gold, fontSize = 17.sp)
                Spacer(Modifier.width(13.dp))
                Text(item, color = if (item == "Home") Gold else TextMuted, fontSize = 13.sp, fontWeight = if (item == "Home") FontWeight.Bold else FontWeight.Normal)
                Spacer(Modifier.weight(1f))
            }
        }
        Spacer(Modifier.weight(1f))
        Text("BHABE DHEMONS  ·  #2Q0Q82C9R", color = TextMuted, fontSize = 10.sp)
    }
}

@Composable
private fun BottomNavigation(selected: String, onSelect: (String) -> Unit) {
    Row(Modifier.fillMaxWidth().background(Color(0xFF0B1018)).navigationBarsPadding().border(1.dp, Color.White.copy(alpha = .05f)).padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceAround) {
        listOf("Home", "War", "AI Coach", "Members", "More").forEach { item ->
            val active = selected == item
            Column(Modifier.clip(RoundedCornerShape(11.dp)).clickable { onSelect(item) }.background(if (active) Gold.copy(alpha = .08f) else Color.Transparent).padding(horizontal = 10.dp, vertical = 5.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(when (item) { "Home" -> "⌂"; "War" -> "⚔"; "AI Coach" -> "✦"; "Members" -> "♟"; else -> "•••" }, color = if (active) Gold else TextMuted, fontSize = 17.sp)
                Text(item, color = if (active) Gold else TextMuted, fontSize = 8.sp, fontWeight = if (active) FontWeight.Bold else FontWeight.Normal)
            }
        }
    }
}

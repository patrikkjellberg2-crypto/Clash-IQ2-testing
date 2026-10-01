package com.clashiq.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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

private val Ink = Color(0xFF080A0E)
private val Panel = Color(0xFF12161D)
private val PanelRaised = Color(0xFF1A2029)
private val Gold = Color(0xFFE8B84D)
private val GoldSoft = Color(0xFF9B7835)
private val White = Color(0xFFF4F2ED)
private val Muted = Color(0xFF89919D)
private val Green = Color(0xFF6CC69A)
private val Red = Color(0xFFE47770)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { ClashIqHome() } }
    }
}

@Composable
private fun ClashIqHome() {
    var selectedTab by remember { mutableStateOf("Home") }
    Surface(Modifier.fillMaxSize(), color = Ink) {
        Column(Modifier.fillMaxSize()) {
            Column(
                Modifier.weight(1f).verticalScroll(rememberScrollState())
                    .background(Brush.verticalGradient(listOf(Color(0xFF171B22), Ink)))
                    .padding(horizontal = 18.dp)
            ) {
                Spacer(Modifier.height(18.dp))
                Header()
                Spacer(Modifier.height(24.dp))
                ClanHero()
                Spacer(Modifier.height(16.dp))
                SectionHeading("CLAN INTELLIGENCE", "Live overview")
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricCard("MEMBERS", "48", "/ 50", Modifier.weight(1f))
                    MetricCard("CLAN LEVEL", "23", "XP  ·  82%", Modifier.weight(1f))
                    MetricCard("WAR LEAGUE", "Master", "League II", Modifier.weight(1f))
                }
                Spacer(Modifier.height(22.dp))
                SectionHeading("WAR CENTER", "Open battle view  ↗")
                Spacer(Modifier.height(10.dp))
                WarCard()
                Spacer(Modifier.height(22.dp))
                SectionHeading("RECENT PERFORMANCE", "Last 5 wars")
                Spacer(Modifier.height(10.dp))
                PerformanceCard()
                Spacer(Modifier.height(22.dp))
                SectionHeading("CAPITAL RAID", "Season overview")
                Spacer(Modifier.height(10.dp))
                CapitalCard()
                Spacer(Modifier.height(24.dp))
            }
            BottomBar(selectedTab) { selectedTab = it }
        }
    }
}

@Composable
private fun Header() {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier.size(43.dp).clip(RoundedCornerShape(13.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF3B3020), Color(0xFF17140F))))
                .border(1.dp, GoldSoft.copy(alpha = .65f), RoundedCornerShape(13.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text("IQ", color = Gold, fontSize = 18.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
        }
        Spacer(Modifier.width(11.dp))
        Column(verticalArrangement = Arrangement.spacedBy((-2).dp)) {
            Text("CLASH", color = White, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
            Text("IQ", color = Gold, fontSize = 23.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
        }
        Spacer(Modifier.weight(1f))
        Box(
            Modifier.clip(CircleShape).background(PanelRaised).border(1.dp, Color.White.copy(alpha = .07f), CircleShape).padding(horizontal = 12.dp, vertical = 9.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                Box(Modifier.size(6.dp).clip(CircleShape).background(Green))
                Text("CONNECTED", color = Muted, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }
        }
    }
}

@Composable
private fun ClanHero() {
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF29251D), Color(0xFF171A20), Color(0xFF11151B))))
            .border(1.dp, Gold.copy(alpha = .22f), RoundedCornerShape(24.dp))
            .padding(18.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(58.dp).clip(RoundedCornerShape(17.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF514027), Color(0xFF211D17))))
                    .border(1.dp, Gold.copy(alpha = .4f), RoundedCornerShape(17.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text("⚔", fontSize = 27.sp, color = Gold)
            }
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f)) {
                Text("YOUR ACTIVE CLAN", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.8.sp)
                Spacer(Modifier.height(5.dp))
                Text("Barber Demons", color = White, fontSize = 20.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("#2Q0Q82C9R", color = Muted, fontSize = 11.sp)
            }
            Text("↗", color = Gold, fontSize = 20.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(18.dp))
        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = .08f)))
        Spacer(Modifier.height(13.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("CLAN STATUS", color = Muted, fontSize = 9.sp, letterSpacing = 1.2.sp)
                Spacer(Modifier.height(4.dp))
                Text("Ready for battle", color = White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            Text("VIEW CLAN  →", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}

@Composable
private fun SectionHeading(title: String, action: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
        Column {
            Text(title, color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.8.sp)
            Spacer(Modifier.height(4.dp))
            Text(action, color = White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        Text("•••", color = Muted, fontSize = 13.sp)
    }
}

@Composable
private fun MetricCard(label: String, value: String, detail: String, modifier: Modifier = Modifier) {
    Column(
        modifier.clip(RoundedCornerShape(17.dp)).background(Panel)
            .border(1.dp, Color.White.copy(alpha = .045f), RoundedCornerShape(17.dp)).padding(11.dp)
    ) {
        Text(label, color = Muted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .7.sp, maxLines = 1)
        Spacer(Modifier.height(9.dp))
        Text(value, color = White, fontSize = 17.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(3.dp))
        Text(detail, color = Gold, fontSize = 9.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun WarCard() {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(21.dp)).background(Panel).border(1.dp, Color.White.copy(alpha = .05f), RoundedCornerShape(21.dp)).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                Box(Modifier.size(7.dp).clip(CircleShape).background(Green))
                Text("WAR IN PROGRESS", color = Green, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
            }
            Text("PREPARATION", color = Muted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .8.sp)
        }
        Spacer(Modifier.height(17.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            WarSide("OUR CLAN", "Barber Demons", "12", true)
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("VS", color = Gold, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                Text("5v5", color = Muted, fontSize = 9.sp)
            }
            WarSide("OPPONENT", "Enemy clan", "8", false)
        }
        Spacer(Modifier.height(16.dp))
        Box(Modifier.fillMaxWidth().height(5.dp).clip(CircleShape).background(PanelRaised)) {
            Box(Modifier.fillMaxWidth(.6f).fillMaxHeight().clip(CircleShape).background(Brush.horizontalGradient(listOf(GoldSoft, Gold))))
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Preparation phase", color = Muted, fontSize = 10.sp)
            Text("Details  →", color = Gold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun WarSide(label: String, name: String, score: String, ours: Boolean) {
    Column(Modifier.width(118.dp), horizontalAlignment = if (ours) Alignment.Start else Alignment.End) {
        Text(label, color = Muted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .8.sp)
        Spacer(Modifier.height(5.dp))
        Text(name, color = White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(4.dp))
        Text(score, color = if (ours) Gold else White, fontSize = 24.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun PerformanceCard() {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(19.dp)).background(Panel).padding(15.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("WAR RECORD", color = Muted, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Text("4W  ·  1L", color = White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(13.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            listOf(true, true, false, true, true).forEach { won ->
                Box(Modifier.weight(1f).height(7.dp).clip(CircleShape).background(if (won) Green else Red))
            }
        }
        Spacer(Modifier.height(9.dp))
        Text("Recent results", color = Muted, fontSize = 10.sp)
    }
}

@Composable
private fun CapitalCard() {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(19.dp)).background(Panel).padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(44.dp).clip(RoundedCornerShape(13.dp)).background(Color(0xFF28231A)), contentAlignment = Alignment.Center) {
            Text("✦", color = Gold, fontSize = 23.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text("CAPITAL CONTRIBUTION", color = Muted, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = .8.sp)
            Spacer(Modifier.height(5.dp))
            Text("Raid weekend", color = White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text("Season data will appear here", color = Muted, fontSize = 10.sp)
        }
        Text("→", color = Gold, fontSize = 19.sp)
    }
}

@Composable
private fun BottomBar(selected: String, onSelect: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().background(Color(0xFF0D1015)).border(width = 1.dp, color = Color.White.copy(alpha = .06f)).navigationBarsPadding().padding(horizontal = 10.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
    ) {
        listOf("Home", "War", "Planner", "Coach", "Profile").forEach { tab ->
            val active = selected == tab
            Column(
                Modifier.clip(RoundedCornerShape(12.dp)).background(if (active) Gold.copy(alpha = .09f) else Color.Transparent)
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    when (tab) { "Home" -> "⌂"; "War" -> "⚔"; "Planner" -> "▦"; "Coach" -> "✧"; else -> "◉" },
                    color = if (active) Gold else Muted, fontSize = 17.sp, fontWeight = FontWeight.Bold
                )
                Text(tab, color = if (active) Gold else Muted, fontSize = 8.sp, fontWeight = if (active) FontWeight.Bold else FontWeight.Normal)
            }
        }
    }
}

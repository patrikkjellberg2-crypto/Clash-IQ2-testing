package com.clashiq.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Obsidian = Color(0xFF090B0F)
private val Panel = Color(0xFF151920)
private val Gold = Color(0xFFE4B64E)
private val Muted = Color(0xFF9299A5)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { NativeDashboardPreview() } }
    }
}

@Composable
private fun NativeDashboardPreview() {
    Surface(Modifier.fillMaxSize(), color = Obsidian) {
        Column(
            Modifier.fillMaxSize()
                .background(Brush.verticalGradient(listOf(Color(0xFF171A20), Obsidian)))
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("CLASH", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
                    Text("IQ", color = Gold, fontSize = 29.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                }
                Text("NATIVE PREVIEW", color = Muted, fontSize = 10.sp, letterSpacing = 1.5.sp)
            }
            PreviewCard("CLAN OVERVIEW", "Your clan at a glance", "Native interface foundation")
            PreviewCard("WAR CENTER", "Battle intelligence", "Backend connection comes next")
            Spacer(Modifier.weight(1f))
            Text("EXPERIMENTAL BUILD • BETA UNCHANGED", Modifier.align(Alignment.CenterHorizontally), color = Muted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
    }
}

@Composable
private fun PreviewCard(label: String, title: String, subtitle: String) {
    Column(
        Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(22.dp)).padding(20.dp)
    ) {
        Text(label, color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
        Spacer(Modifier.height(12.dp))
        Text(title, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Text(subtitle, color = Muted, fontSize = 13.sp)
    }
}

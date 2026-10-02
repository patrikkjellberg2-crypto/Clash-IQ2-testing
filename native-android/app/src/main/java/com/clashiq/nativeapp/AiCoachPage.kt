package com.clashiq.nativeapp

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

private const val COACH_URL = "https://clash-iq-builder-base-test.onrender.com/api/ai/coach"

@Composable
fun AiCoachPage() {
    var mode by remember { mutableStateOf("clan") }
    var clanTag by remember { mutableStateOf("#2Q0Q82C9R") }
    var question by remember { mutableStateOf("Give me the three most important things we should do next.") }
    var answer by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
        Text("CLASH IQ / COMMAND CENTER", color = Color(0xFFFFC54D), fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(5.dp))
        Text("AI Coach", color = Color(0xFFF7F4EC), fontSize = 26.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(10.dp))
        Box(
            Modifier.fillMaxWidth().height(185.dp)
                .clip(RoundedCornerShape(22.dp))
                .border(1.dp, Color(0xFF48B9F4).copy(alpha = .35f), RoundedCornerShape(22.dp))
        ) {
            Box(
                Modifier.fillMaxSize().background(
                    androidx.compose.ui.graphics.Brush.radialGradient(
                        listOf(Color(0xFF25476A).copy(alpha = .62f), Color(0xFF101722), Color(0xFF08111B))
                    )
                )
            )
            Box(
                Modifier.fillMaxSize().background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        listOf(Color(0xFF08111B).copy(alpha = .18f), Color(0xFF08111B).copy(alpha = .78f))
                    )
                )
            )
            Column(Modifier.fillMaxSize().padding(16.dp)) {
                Text("AI-POWERED COMMAND", color = Color(0xFF48B9F4), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
                Spacer(Modifier.weight(1f))
                Text("READ THE WAR BEFORE YOU ATTACK.", color = Color(0xFFF7F4EC), fontSize = 18.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(4.dp))
                Text("Clan intelligence, opponent reads and tactical recommendations.", color = Color(0xFFB8C0CC), fontSize = 10.sp)
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("clan" to "Clan", "opponent" to "Opponent", "question" to "Ask").forEach { (value, label) ->
                FilterChip(selected = mode == value, onClick = { mode = value }, label = { Text(label) })
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = clanTag, onValueChange = { clanTag = it }, modifier = Modifier.fillMaxWidth(),
            label = { Text("Clan tag") }, singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                focusedBorderColor = Color(0xFFFFC54D), unfocusedBorderColor = Color(0xFF394454),
                focusedLabelColor = Color(0xFFFFC54D), unfocusedLabelColor = Color(0xFF8D98A8)
            )
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = question, onValueChange = { question = it }, modifier = Modifier.fillMaxWidth(),
            label = { Text("What should the coach analyze?") }, minLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                focusedBorderColor = Color(0xFFFFC54D), unfocusedBorderColor = Color(0xFF394454),
                focusedLabelColor = Color(0xFFFFC54D), unfocusedLabelColor = Color(0xFF8D98A8)
            )
        )
        Spacer(Modifier.height(10.dp))
        Button(
            enabled = !loading && question.isNotBlank() && clanTag.isNotBlank(),
            onClick = {
                loading = true; error = ""; answer = ""
                val selectedMode = mode
                val selectedTag = clanTag.trim().let { if (it.startsWith("#")) it else "#$it" }
                val prompt = question.trim()
                thread {
                    var resultAnswer = ""
                    var resultError = ""
                    try {
                        val connection = (URL(COACH_URL).openConnection() as HttpURLConnection).apply {
                            requestMethod = "POST"
                            connectTimeout = 20000
                            readTimeout = 90000
                            doOutput = true
                            setRequestProperty("Content-Type", "application/json")
                            setRequestProperty("Accept", "application/json")
                            setRequestProperty("X-ClashIQ-Client-ID", "clashiq-android")
                        }
                        try {
                            val payload = JSONObject().put("clanTag", selectedTag)
                                .put("mode", selectedMode).put("question", prompt).toString()
                            connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
                            val status = connection.responseCode
                            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
                            val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
                            val json = JSONObject(body)
                            if (status !in 200..299) resultError = json.optString("error", "AI Coach request failed ($status).")
                            else resultAnswer = json.optString("answer", "No analysis was returned.")
                        } finally { connection.disconnect() }
                    } catch (e: Exception) {
                        resultError = e.message ?: "Could not connect to AI Coach."
                    }
                    android.os.Handler(android.os.Looper.getMainLooper()).post {
                        answer = resultAnswer
                        error = resultError
                        loading = false
                    }
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC54D), contentColor = Color(0xFF070A10))
        ) { Text(if (loading) "Analyzing…" else "Analyze", fontWeight = FontWeight.Bold) }

        if (loading) { Spacer(Modifier.height(12.dp)); LinearProgressIndicator(Modifier.fillMaxWidth(), color = Color(0xFFFFC54D)) }
        if (error.isNotBlank()) {
            Spacer(Modifier.height(14.dp))
            Text(error, color = Color(0xFFFF8A8A), fontSize = 13.sp)
        }
        if (answer.isNotBlank()) {
            Spacer(Modifier.height(16.dp))
            Column(Modifier.fillMaxWidth().background(Color(0xFF111722), RoundedCornerShape(16.dp))
                .border(1.dp, Color(0xFFFFC54D).copy(alpha = .25f), RoundedCornerShape(16.dp)).padding(16.dp)) {
                Text("COACH ANALYSIS", color = Color(0xFFFFC54D), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(9.dp))
                Text(answer, color = Color(0xFFF7F4EC), fontSize = 14.sp, lineHeight = 21.sp)
            }
        }
        Spacer(Modifier.height(20.dp))
    }
}
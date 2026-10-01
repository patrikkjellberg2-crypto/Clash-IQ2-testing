package com.clashiq.nativeapp

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun GoogleLoginScreen(onSignedIn: () -> Unit) {
    val context = LocalContext.current
    val activity = context as? Activity
    val credentialManager = remember { CredentialManager.create(context) }
    val scope = rememberCoroutineScope()
    var clientId by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val result = AuthApi.googleClientId()
        if (result.ok) {
            clientId = runCatching { JSONObject(result.userJson.orEmpty()).optString("clientId").takeIf { it.isNotBlank() } }.getOrNull()
            if (clientId == null) error = "Google sign-in is not configured on the server yet."
        } else error = result.message
    }

    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF182231), Color(0xFF070A10), Color(0xFF05070B)))).padding(22.dp), contentAlignment = Alignment.Center) {
        Column(Modifier.fillMaxWidth().border(1.dp, Color(0xFF9E742D).copy(alpha = .65f), RoundedCornerShape(24.dp)).background(Color(0xFF111722), RoundedCornerShape(24.dp)).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("♛", color = Color(0xFFFFC54D), fontSize = 54.sp)
            Spacer(Modifier.height(12.dp))
            Text("WELCOME TO CLASH IQ", color = Color(0xFFFFC54D), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            Spacer(Modifier.height(9.dp))
            Text("Sign in to continue", color = Color(0xFFF7F4EC), fontSize = 25.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
            Spacer(Modifier.height(9.dp))
            Text("Your account keeps your player connection and clan data tied to you.", color = Color(0xFF8D98A8), fontSize = 13.sp, lineHeight = 19.sp, textAlign = TextAlign.Center)
            Spacer(Modifier.height(24.dp))
            Button(
                onClick = {
                    val configuredId = clientId
                    if (activity == null || configuredId.isNullOrBlank()) {
                        error = "Google sign-in is not ready. Check the server's Google client ID."
                    } else scope.launch {
                        loading = true
                        error = ""
                        try {
                            val option = GetGoogleIdOption.Builder()
                                .setServerClientId(configuredId)
                                .setFilterByAuthorizedAccounts(false)
                                .build()
                            val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
                            val response = credentialManager.getCredential(activity, request)
                            val credential = response.credential
                            if (credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                error = "Choose a Google account to continue."
                            } else {
                                val token = GoogleIdTokenCredential.createFrom(credential.data).idToken
                                val result = AuthApi.signInWithGoogleIdToken(token)
                                if (result.ok) onSignedIn() else error = result.message
                            }
                        } catch (e: GetCredentialException) {
                            error = e.message?.takeIf { it.isNotBlank() } ?: "Google sign-in was cancelled or unavailable."
                        } catch (_: Exception) {
                            error = "Could not complete Google sign-in. Please try again."
                        } finally {
                            loading = false
                        }
                    }
                },
                enabled = !loading && clientId != null && activity != null,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC54D), contentColor = Color(0xFF070A10))
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color(0xFF070A10), strokeWidth = 2.dp)
                else Text("CONTINUE WITH GOOGLE", fontWeight = FontWeight.Black, letterSpacing = .5.sp)
            }
            if (error.isNotBlank()) {
                Spacer(Modifier.height(14.dp))
                Text(error, color = Color(0xFFFF7770), fontSize = 12.sp, textAlign = TextAlign.Center)
            }
            Spacer(Modifier.height(18.dp))
            Text("Secure sign-in · No password stored in Clash IQ", color = Color(0xFF8D98A8), fontSize = 10.sp, textAlign = TextAlign.Center)
        }
    }
}

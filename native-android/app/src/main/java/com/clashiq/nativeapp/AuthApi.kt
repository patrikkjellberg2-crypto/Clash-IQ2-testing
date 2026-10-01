package com.clashiq.nativeapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Small native client for the existing Clash IQ auth endpoints.
 * The session cookie is held in memory for this app process.
 */
object AuthApi {
    private const val BASE_URL = "https://clash-iq2-testing.onrender.com/api"
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val cookieJar = object : CookieJar {
        private val cookies = mutableMapOf<String, List<Cookie>>()
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
            synchronized(this) { this.cookies[url.host] = cookies }
        }
        override fun loadForRequest(url: HttpUrl): List<Cookie> =
            synchronized(this) { cookies[url.host].orEmpty().filterNot { it.expiresAt < System.currentTimeMillis() } }
    }
    private val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    data class Result(val ok: Boolean, val message: String, val userJson: String? = null)

    suspend fun googleClientId(): Result = request("GET", "/auth/config")

    /** Sends a Google ID token to the server and keeps its session cookie in this process. */
    suspend fun signInWithGoogleIdToken(idToken: String): Result {
        if (idToken.isBlank()) return Result(false, "Google did not return an ID token")
        val body = JSONObject().put("credential", idToken).toString()
        return request("POST", "/auth/google", body)
    }

    suspend fun currentUser(): Result = request("GET", "/auth/me")

    suspend fun logout(): Result = request("POST", "/auth/logout", "{}")

    private suspend fun request(method: String, path: String, body: String? = null): Result =
        withContext(Dispatchers.IO) {
            try {
                val builder = Request.Builder().url(BASE_URL + path)
                    .header("Accept", "application/json")
                if (method == "POST") builder.post((body ?: "{}").toRequestBody(jsonType))
                else builder.get()
                client.newCall(builder.build()).execute().use { response ->
                    val text = response.body?.string().orEmpty()
                    val json = runCatching { JSONObject(text) }.getOrNull()
                    if (response.isSuccessful) {
                        Result(true, "OK", json?.optJSONObject("user")?.toString() ?: text)
                    } else {
                        Result(false, json?.optString("error")?.takeIf { it.isNotBlank() }
                            ?: "Request failed (HTTP ${response.code})")
                    }
                }
            } catch (_: IOException) {
                Result(false, "Could not connect to Clash IQ. Check your connection and try again.")
            } catch (_: Exception) {
                Result(false, "Authentication request failed.")
            }
        }
}

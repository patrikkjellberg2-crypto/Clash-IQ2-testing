package com.clashiq.nativeapp

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Hosts the real Clash IQ web application instead of the temporary native mock screens.
 * This keeps the UI and product features aligned with the deployed frontend.
 */
class MainActivity : ComponentActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.loadsImagesAutomatically = true
                        settings.useWideViewPort = true
                        settings.loadWithOverviewMode = true
                        webViewClient = WebViewClient()
                        webChromeClient = WebChromeClient()
                        loadUrl("https://clash-iq2-testing.onrender.com")
                    }
                }
            )
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // WebView navigation is handled by the embedded page.
        super.onBackPressed()
    }
}

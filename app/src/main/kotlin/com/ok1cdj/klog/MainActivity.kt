package com.ok1cdj.klog

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import android.webkit.JsResult
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * kLog Android shell (ch. 1, phase 2). A single WebView that runs the bundled web
 * app. Storage/export/share/keep-awake go through KLogBridge (window.KLogNative);
 * the web layer is otherwise identical to the browser build.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var pendingExport: String? = null

    // System "Save as" dialog (SAF) for exporting a log as a .adi file.
    private val createDocument = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/octet-stream")
    ) { uri: Uri? ->
        val content = pendingExport
        pendingExport = null
        if (uri != null && content != null) {
            contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray()) }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // The web build (base /kLog/, shared with GitHub Pages) is bundled at
        // assets/kLog/; serve the whole assets root so /kLog/... resolves.
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            addJavascriptInterface(KLogBridge(this@MainActivity), "KLogNative")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
            }
            // Without a WebChromeClient the WebView silently suppresses window.alert /
            // confirm — which would break delete confirmations and the export prompt.
            webChromeClient = object : WebChromeClient() {
                override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult): Boolean {
                    AlertDialog.Builder(this@MainActivity)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok) { _, _ -> result.confirm() }
                        .setOnCancelListener { result.cancel() }
                        .show()
                    return true
                }

                override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult): Boolean {
                    AlertDialog.Builder(this@MainActivity)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok) { _, _ -> result.confirm() }
                        .setNegativeButton(android.R.string.cancel) { _, _ -> result.cancel() }
                        .setOnCancelListener { result.cancel() }
                        .show()
                    return true
                }
            }
        }
        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/kLog/index.html")
    }

    fun setKeepScreenOn(on: Boolean) = runOnUiThread {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    fun exportFile(content: String, filename: String) {
        pendingExport = content
        runOnUiThread { createDocument.launch(filename) }
    }

    fun shareFile(content: String, filename: String) = runOnUiThread {
        val dir = File(cacheDir, "shared").apply { mkdirs() }
        val file = File(dir, filename).apply { writeText(content) }
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "application/octet-stream"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(send, filename))
    }
}

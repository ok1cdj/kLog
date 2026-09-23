package com.ok1cdj.klog

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONArray
import java.io.File

/**
 * window.KLogNative — the storage/host bridge (ch. 12). Pure file I/O keyed by log
 * id, mirroring the OPFS worker protocol; the web NativePlatform wraps these
 * synchronous methods into the async KLogPlatform. Logs are real .adi files in
 * app storage (reachable via ADB), so there is no WebKit-style eviction.
 */
class KLogBridge(private val activity: MainActivity) {

    private val ctx: Context = activity.applicationContext
    private val logsDir: File = File(ctx.filesDir, "logs").apply { mkdirs() }
    private val prefs = ctx.getSharedPreferences("klog", Context.MODE_PRIVATE)

    private fun adi(id: String) = File(logsDir, "$id.adi")
    private fun journal(id: String) = File(logsDir, "$id.journal")

    @JavascriptInterface
    fun displayMode(): String = "eink" // e-ink hardcoded in the shell (ch. 1)

    @JavascriptInterface
    fun appVersion(): String = BuildConfig.VERSION_NAME // APK version, shown in About

    @JavascriptInterface
    fun isPersisted(): Boolean = true // real files in app storage

    @JavascriptInterface
    fun list(): String {
        val ids = logsDir.listFiles { f -> f.name.endsWith(".adi") }
            ?.map { it.name.removeSuffix(".adi") }
            ?: emptyList()
        return JSONArray(ids).toString()
    }

    @JavascriptInterface
    fun createHeader(id: String, content: String) = adi(id).writeText(content)

    @JavascriptInterface
    fun append(id: String, text: String) = adi(id).appendText(text)

    @JavascriptInterface
    fun read(id: String): String = adi(id).let { if (it.exists()) it.readText() else "" }

    @JavascriptInterface
    fun rewrite(id: String, content: String) = adi(id).writeText(content)

    @JavascriptInterface
    fun remove(id: String) {
        adi(id).delete()
        journal(id).delete()
    }

    @JavascriptInterface
    fun writeJournal(id: String, text: String) = journal(id).writeText(text)

    @JavascriptInterface
    fun readJournal(id: String): String = journal(id).let { if (it.exists()) it.readText() else "" }

    @JavascriptInterface
    fun clearJournal(id: String) = journal(id).writeText("")

    @JavascriptInterface
    fun getSetting(key: String): String? = prefs.getString(key, null)

    @JavascriptInterface
    fun setSetting(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    @JavascriptInterface
    fun exportLog(id: String, filename: String) = activity.exportFile(read(id), filename)

    @JavascriptInterface
    fun shareLog(id: String, filename: String) = activity.shareFile(read(id), filename)

    @JavascriptInterface
    fun keepAwake(on: Boolean) = activity.setKeepScreenOn(on)
}

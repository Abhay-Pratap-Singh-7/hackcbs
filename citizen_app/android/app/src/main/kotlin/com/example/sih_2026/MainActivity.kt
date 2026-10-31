package com.example.sih_2026

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.sih_2026.app/share"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "share") {
                val text = call.argument<String>("text") ?: ""
                val subject = call.argument<String>("subject") ?: ""
                val packageName = call.argument<String>("packageName")

                val sendIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, text)
                    if (subject.isNotEmpty()) {
                        putExtra(Intent.EXTRA_SUBJECT, subject)
                    }
                    type = "text/plain"
                    if (!packageName.isNullOrEmpty()) {
                        setPackage(packageName)
                    }
                }

                try {
                    if (!packageName.isNullOrEmpty()) {
                        try {
                            context.startActivity(sendIntent)
                            result.success(true)
                            return@setMethodCallHandler
                        } catch (_: Exception) {
                            // Target app not installed, fallback to system chooser
                            val fallbackIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, text)
                                if (subject.isNotEmpty()) {
                                    putExtra(Intent.EXTRA_SUBJECT, subject)
                                }
                                type = "text/plain"
                            }
                            val chooser = Intent.createChooser(fallbackIntent, "Share Issue via")
                            context.startActivity(chooser)
                            result.success(true)
                            return@setMethodCallHandler
                        }
                    }

                    val shareIntent = Intent.createChooser(sendIntent, "Share Issue via")
                    context.startActivity(shareIntent)
                    result.success(true)
                } catch (e: Exception) {
                    result.error("SHARE_ERROR", e.localizedMessage, null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}

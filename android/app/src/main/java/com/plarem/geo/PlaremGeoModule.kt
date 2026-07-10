package com.plarem.geo

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Bridge for controlling {@link PlaremGeoService} and the battery-optimization
 * exemption from JS. Android only; on iOS the JS wrapper no-ops.
 */
class PlaremGeoModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun startService(count: Int) {
        val intent = Intent(reactContext, PlaremGeoService::class.java).apply {
            putExtra(PlaremGeoService.EXTRA_COUNT, count)
        }
        try {
            ContextCompat.startForegroundService(reactContext, intent)
        } catch (e: Exception) {
            // Android 12+ can reject foreground-service starts from the
            // background (ForegroundServiceStartNotAllowedException). The OS
            // geofence path still works without the service; never crash.
            Log.w(NAME, "startService failed", e)
        }
    }

    @ReactMethod
    fun stopService() {
        // NEVER deliver a stop via startForegroundService(): every such start
        // must be matched by a startForeground() call, so a "start to stop"
        // round-trip crashes with ForegroundServiceDidNotStartInTimeException.
        // Context.stopService() has no such contract and is a no-op when the
        // service is not running.
        try {
            reactContext.stopService(Intent(reactContext, PlaremGeoService::class.java))
        } catch (e: Exception) {
            Log.w(NAME, "stopService failed", e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(PlaremGeoService.running)
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val ignoring = powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: true
        promise.resolve(ignoring)
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${reactContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            val activity = reactContext.currentActivity
            if (activity != null) {
                activity.startActivity(intent)
            } else {
                reactContext.startActivity(intent)
            }
        } catch (e: Exception) {
            // Fall back to the app's battery settings screen if the direct
            // request dialog is unavailable on this OEM.
            openBatterySettings()
        }
    }

    private fun openBatterySettings() {
        try {
            val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(fallback)
        } catch (_: Exception) {
        }
    }

    // Required so JS `NativeEventEmitter` does not warn about missing methods.
    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    companion object {
        const val NAME = "PlaremGeo"
    }
}

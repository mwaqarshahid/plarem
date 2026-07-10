package com.plarem.geo

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactApplication
import com.plarem.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/**
 * Foreground service that keeps a low-power location request active while the
 * user has pending reminders.
 *
 * Why this exists: Play Services geofencing is *opportunistic* — it only
 * re-evaluates fences when the OS happens to receive a location fix. With the
 * app killed and no active location client, fixes can be minutes apart, so a
 * geofence driven through at speed is frequently never sampled. Holding a
 * live FusedLocationProvider request (a) makes geofence transitions fire within
 * seconds, and (b) keeps our process alive against aggressive OEM battery
 * managers. Each fix is also forwarded to JS so the app can run its own
 * distance-check fallback (belt and suspenders, independent of Play Services).
 */
class PlaremGeoService : Service() {

    private var fusedClient: FusedLocationProviderClient? = null
    private var reminderCount = 0

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return
            emitLocation(location.latitude, location.longitude)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Contract: every start delivered through startForegroundService() MUST
        // be answered with startForeground(), even when the intent asks us to
        // stop — otherwise the OS raises
        // ForegroundServiceDidNotStartInTimeException and kills the app.
        try {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                buildNotification(reminderCount),
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                } else {
                    0
                },
            )
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
            stopSelf()
            return START_NOT_STICKY
        }

        if (intent?.action == ACTION_STOP) {
            stopUpdatesAndSelf()
            return START_NOT_STICKY
        }

        reminderCount = intent?.getIntExtra(EXTRA_COUNT, reminderCount) ?: reminderCount
        // Refresh the notification with the up-to-date reminder count.
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .notify(NOTIFICATION_ID, buildNotification(reminderCount))
        } catch (e: Exception) {
            Log.w(TAG, "notification refresh failed", e)
        }

        running = true
        startLocationUpdates()
        return START_STICKY
    }

    override fun onDestroy() {
        stopLocationUpdates()
        running = false
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Keep monitoring even after the user swipes the app away.
        super.onTaskRemoved(rootIntent)
    }

    private fun startLocationUpdates() {
        if (!hasLocationPermission()) {
            Log.w(TAG, "Location permission missing; not requesting updates")
            return
        }
        val client = fusedClient ?: LocationServices.getFusedLocationProviderClient(this).also {
            fusedClient = it
        }
        val request = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            UPDATE_INTERVAL_MS,
        )
            .setMinUpdateIntervalMillis(FASTEST_INTERVAL_MS)
            .setMinUpdateDistanceMeters(MIN_DISPLACEMENT_M)
            .setWaitForAccurateLocation(false)
            .build()
        try {
            client.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            Log.e(TAG, "requestLocationUpdates denied", e)
        }
    }

    private fun stopLocationUpdates() {
        fusedClient?.removeLocationUpdates(locationCallback)
    }

    private fun stopUpdatesAndSelf() {
        stopLocationUpdates()
        running = false
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun emitLocation(latitude: Double, longitude: Double) {
        val reactContext: ReactContext? =
            (application as? ReactApplication)?.reactHost?.currentReactContext
        if (reactContext == null || !reactContext.hasActiveReactInstance()) {
            // JS is not alive right now; Play Services geofencing still benefits
            // from the active location request. The fallback will resume when JS
            // is back.
            return
        }
        val params = Arguments.createMap().apply {
            putDouble("latitude", latitude)
            putDouble("longitude", longitude)
        }
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_NAME, params)
        } catch (e: Exception) {
            Log.e(TAG, "emit location failed", e)
        }
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) {
            return
        }
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Reminder monitoring",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Shown while Plarem is watching for your location reminders."
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(count: Int): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val contentIntent = launchIntent?.let {
            PendingIntent.getActivity(
                this,
                0,
                it,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                },
            )
        }
        val text = when {
            count <= 0 -> "Watching for your location reminders"
            count == 1 -> "Watching 1 place for reminders"
            else -> "Watching $count places for reminders"
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Plarem")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(contentIntent)
            .build()
    }

    companion object {
        const val TAG = "PlaremGeoService"
        const val CHANNEL_ID = "plarem-monitoring"
        const val NOTIFICATION_ID = 4242
        const val EVENT_NAME = "PlaremGeoLocation"
        const val ACTION_STOP = "com.plarem.geo.ACTION_STOP"
        const val EXTRA_COUNT = "count"

        private const val UPDATE_INTERVAL_MS = 30_000L
        private const val FASTEST_INTERVAL_MS = 10_000L
        private const val MIN_DISPLACEMENT_M = 50f

        @Volatile
        var running: Boolean = false
            private set
    }
}

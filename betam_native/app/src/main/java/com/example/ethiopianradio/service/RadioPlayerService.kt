package com.example.ethiopianradio.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.example.ethiopianradio.R
import com.example.ethiopianradio.data.model.RadioStation
import com.example.ethiopianradio.ui.MainActivity

class RadioPlayerService : MediaSessionService() {
    private var mediaSession: MediaSession? = null
    private var exoPlayer: ExoPlayer? = null
    private var currentStation: RadioStation? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initializePlayer()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_description)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun initializePlayer() {
        exoPlayer = ExoPlayer.Builder(this).build().apply {
            repeatMode = Player.REPEAT_MODE_OFF
            playWhenReady = false
        }
        mediaSession = MediaSession.Builder(this, exoPlayer!!).build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY -> {
                val station = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra("station", RadioStation::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra("station")
                }
                station?.let { playStation(it) }
            }
            ACTION_PAUSE -> {
                if (isPlaying()) {
                    pause()
                } else {
                    play()
                }
            }
            ACTION_STOP -> stop()
        }
        return START_STICKY
    }

    private fun playStation(station: RadioStation) {
        currentStation = station
        exoPlayer?.let { player ->
            val mediaItem = MediaItem.Builder()
                .setUri(station.streamUrl)
                .setMediaMetadata(
                    androidx.media3.common.MediaMetadata.Builder()
                        .setTitle(station.name)
                        .setArtist(station.city)
                        .build()
                )
                .build()
            player.setMediaItem(mediaItem)
            player.prepare()
            player.play()
            updateNotification(station)
        }
    }

    private fun pause() {
        exoPlayer?.pause()
    }

    private fun play() {
        exoPlayer?.play()
    }

    private fun stop() {
        exoPlayer?.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    fun isPlaying(): Boolean {
        return exoPlayer?.isPlaying == true
    }

    fun getCurrentStation(): RadioStation? {
        return currentStation
    }

    private fun updateNotification(station: RadioStation) {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(station.name)
            .setContentText(station.city)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession {
        return mediaSession ?: throw IllegalStateException("MediaSession not initialized")
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        exoPlayer = null
        super.onDestroy()
    }

    companion object {
        private const val CHANNEL_ID = "radio_player_channel"
        private const val NOTIFICATION_ID = 1
        const val ACTION_PLAY = "com.example.ethiopianradio.PLAY"
        const val ACTION_PAUSE = "com.example.ethiopianradio.PAUSE"
        const val ACTION_STOP = "com.example.ethiopianradio.STOP"
    }
}


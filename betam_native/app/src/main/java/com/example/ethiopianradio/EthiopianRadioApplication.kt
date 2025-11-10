package com.example.ethiopianradio

import android.app.Application
import com.google.firebase.FirebaseApp

class EthiopianRadioApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}


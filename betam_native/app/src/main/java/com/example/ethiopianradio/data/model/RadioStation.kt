package com.example.ethiopianradio.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class RadioStation(
    val id: String = "",
    val name: String = "",
    val frequency: String = "",
    val city: String = "",
    val imageUrl: String = "",
    val streamUrl: String = ""
) : Parcelable


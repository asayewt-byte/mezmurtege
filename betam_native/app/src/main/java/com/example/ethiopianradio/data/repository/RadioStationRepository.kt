package com.example.ethiopianradio.data.repository

import com.example.ethiopianradio.data.model.RadioStation
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class RadioStationRepository {
    private val firestore = FirebaseFirestore.getInstance()
    private val stationsRef = firestore.collection("stations")

    fun getStations(): Flow<List<RadioStation>> = callbackFlow {
        val subscription = stationsRef
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("RadioStationRepository", "Error getting stations: ${error.message}", error)
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val stations = snapshot?.documents?.mapNotNull { doc ->
                    try {
                        RadioStation(
                            id = doc.id,
                            name = doc.getString("name") ?: "",
                            frequency = doc.getString("frequency") ?: "",
                            city = doc.getString("city") ?: "",
                            imageUrl = doc.getString("imageUrl") ?: "",
                            streamUrl = doc.getString("streamUrl") ?: ""
                        )
                    } catch (e: Exception) {
                        android.util.Log.e("RadioStationRepository", "Error parsing station ${doc.id}: ${e.message}", e)
                        null
                    }
                } ?: emptyList()

                android.util.Log.d("RadioStationRepository", "Loaded ${stations.size} stations")
                trySend(stations.sortedBy { it.name })
            }

        awaitClose { subscription.remove() }
    }

    suspend fun getStationsOnce(): List<RadioStation> {
        return try {
            val snapshot = stationsRef.get().await()
            val stations = snapshot.documents.mapNotNull { doc ->
                try {
                    RadioStation(
                        id = doc.id,
                        name = doc.getString("name") ?: "",
                        frequency = doc.getString("frequency") ?: "",
                        city = doc.getString("city") ?: "",
                        imageUrl = doc.getString("imageUrl") ?: "",
                        streamUrl = doc.getString("streamUrl") ?: ""
                    )
                } catch (e: Exception) {
                    android.util.Log.e("RadioStationRepository", "Error parsing station ${doc.id}: ${e.message}", e)
                    null
                }
            }
            android.util.Log.d("RadioStationRepository", "Fetched ${stations.size} stations")
            stations.sortedBy { it.name }
        } catch (e: Exception) {
            android.util.Log.e("RadioStationRepository", "Error fetching stations: ${e.message}", e)
            emptyList()
        }
    }

    suspend fun addStation(station: RadioStation): String {
        val data = hashMapOf(
            "name" to station.name,
            "frequency" to station.frequency,
            "city" to station.city,
            "imageUrl" to station.imageUrl,
            "streamUrl" to station.streamUrl,
            "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp(),
            "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
        )
        val docRef = stationsRef.add(data).await()
        return docRef.id
    }

    suspend fun updateStation(station: RadioStation) {
        val data = hashMapOf<String, Any>(
            "name" to station.name,
            "frequency" to station.frequency,
            "city" to station.city,
            "imageUrl" to station.imageUrl,
            "streamUrl" to station.streamUrl,
            "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
        )
        stationsRef.document(station.id).update(data).await()
    }

    suspend fun deleteStation(stationId: String) {
        stationsRef.document(stationId).delete().await()
    }
}


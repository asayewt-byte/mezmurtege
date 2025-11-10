package com.example.ethiopianradio.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ethiopianradio.data.model.RadioStation
import com.example.ethiopianradio.data.repository.RadioStationRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class RadioStationViewModel : ViewModel() {
    private val repository = RadioStationRepository()

    private val _stations = MutableLiveData<List<RadioStation>>()
    val stations: LiveData<List<RadioStation>> = _stations

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _currentStation = MutableLiveData<RadioStation?>()
    val currentStation: LiveData<RadioStation?> = _currentStation

    init {
        loadStations()
    }

    fun loadStations() {
        _isLoading.value = true
        _error.value = null
        
        // Use real-time listener to get updates when stations are added via web admin
        repository.getStations()
            .onEach { stationList ->
                android.util.Log.d("RadioStationViewModel", "Received ${stationList.size} stations")
                _stations.value = if (stationList.isEmpty()) {
                    android.util.Log.d("RadioStationViewModel", "No stations found, using defaults")
                    getDefaultStations()
                } else {
                    android.util.Log.d("RadioStationViewModel", "Using ${stationList.size} stations from Firebase")
                    stationList
                }
                _isLoading.value = false
            }
            .catch { exception ->
                android.util.Log.e("RadioStationViewModel", "Error loading stations: ${exception.message}", exception)
                _error.value = exception.message ?: "Unknown error"
                _stations.value = getDefaultStations()
                _isLoading.value = false
            }
            .launchIn(viewModelScope)
    }
    
    fun refreshStations() {
        loadStations()
    }

    fun addStation(station: RadioStation) {
        viewModelScope.launch {
            try {
                repository.addStation(station)
                loadStations()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun setCurrentStation(station: RadioStation) {
        _currentStation.value = station
    }

    fun deleteStation(station: RadioStation) {
        viewModelScope.launch {
            try {
                repository.deleteStation(station.id)
                android.util.Log.d("RadioStationViewModel", "Deleted station: ${station.name}")
            } catch (e: Exception) {
                android.util.Log.e("RadioStationViewModel", "Error deleting station: ${e.message}", e)
                _error.value = e.message
            }
        }
    }

    private fun getDefaultStations(): List<RadioStation> {
        return listOf(
            RadioStation(
                id = "1",
                name = "Mirt Internet Radio",
                frequency = "Online",
                city = "Ethiopia",
                imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuACjSKU528SEMPc3XOyJVONhGegF7jsC-SU4WnIijzfhhZAaoW8dVPPYs7VMW2Qv5IWMCRuWHKm8KFhW_YkpOJ3IACPdwrhLqYjxBEhmKT2MP4Dy6TpnW4lh0qEEhwDX47fWVPuX1qKmOZbQs-BFcYC1WIMgmHA0pF0avqPCFEDUw3jMtoZSUy6JkZArm3oZp0hO1jU3rZpq6y_XoxHwL3YyIkrmxNFvDidfSIJEoiyz3frP1VBB9VJaCsFn4QCM-wU-0SorSiahw",
                streamUrl = "https://stream-175.zeno.fm/akmuznguawzuv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJha211em5ndWF3enV2IiwiaG9zdCI6InN0cmVhbS0xNzUuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6IlFGYkRnSkpKUkdLU3BTazdDV2NGZlEiLCJpYXQiOjE3NjI3MTg2MjUsImV4cCI6MTc2MjcxODY4NX0.DPMtGQ6GqhNwzfcSAVpBil2tfPGxOdQPAu2G7bZCPOI&rj-ttl=5&rj-tok=AAABct-Y5fsAU83o0_k8PYaxlQ"
            )
        )
    }
}


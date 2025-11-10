package com.example.ethiopianradio.ui

import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.animation.LinearInterpolator
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.example.ethiopianradio.databinding.ActivityMainBinding
import com.example.ethiopianradio.service.RadioPlayerService
import com.example.ethiopianradio.ui.adapter.StationAdapter
import com.example.ethiopianradio.ui.viewmodel.RadioStationViewModel

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: RadioStationViewModel by viewModels()
    private lateinit var stationAdapter: StationAdapter
    private var miniVinylAnimator: ObjectAnimator? = null
    private var miniTickerAnimator: ObjectAnimator? = null
    private var allStations: List<com.example.ethiopianradio.data.model.RadioStation> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        startPlayerService()
    }

    private fun setupRecyclerView() {
        stationAdapter = StationAdapter(
            onStationClick = { station ->
                viewModel.setCurrentStation(station)
            },
            onPlayClick = { station ->
                viewModel.setCurrentStation(station)
                playStation(station)
            },
            onLongClick = { station ->
                showDeleteDialog(station)
                true
            }
        )
        binding.recyclerViewStations.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = stationAdapter
        }
    }

    private fun setupObservers() {
        viewModel.stations.observe(this) { stations ->
            allStations = stations
            filterStations(binding.editSearch.text.toString())
        }

        viewModel.isLoading.observe(this) { isLoading ->
            // Show/hide loading indicator
        }

        viewModel.error.observe(this) { error ->
            error?.let {
                android.util.Log.e("MainActivity", "Error: $it")
                android.widget.Toast.makeText(this, "Error loading stations: $it", android.widget.Toast.LENGTH_LONG).show()
            }
        }

        viewModel.currentStation.observe(this) { station ->
            station?.let {
                binding.miniPlayer.root.visibility = View.VISIBLE
                binding.miniPlayer.textStationNameMini.text = "${it.name} ${it.frequency}"
                val nowPlayingText = "Now Playing: ${it.name} - Live Stream    "
                binding.miniPlayer.textNowPlayingMini.text = nowPlayingText
                // Update mini player image
                Glide.with(this)
                    .load(it.imageUrl)
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .error(android.R.drawable.ic_menu_report_image)
                    .circleCrop()
                    .into(binding.miniPlayer.imageMiniPlayer)
                
                // Start animations for mini player
                startMiniVinylAnimation()
                binding.miniPlayer.textNowPlayingMini.post {
                    startMiniTickerAnimation()
                }
            } ?: run {
                binding.miniPlayer.root.visibility = View.GONE
                stopMiniAnimations()
            }
        }
    }

    private fun setupClickListeners() {
        binding.miniPlayer.buttonPlayPause.setOnClickListener {
            togglePlayPause()
        }

        binding.buttonMenu.setOnClickListener {
            val intent = Intent(this, com.example.ethiopianradio.ui.admin.AdminActivity::class.java)
            startActivity(intent)
        }

        binding.buttonSearch.setOnClickListener {
            toggleSearch()
        }

        // Close search when clicking outside or on clear button
        binding.editSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH) {
                // Hide keyboard but keep search visible
                val imm = getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.hideSoftInputFromWindow(binding.editSearch.windowToken, 0)
                true
            } else {
                false
            }
        }

        binding.editSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, before: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString() ?: ""
                filterStations(query)
                // If search is cleared, optionally close search bar
                if (query.isEmpty() && binding.searchCard.visibility == View.VISIBLE) {
                    // Keep search bar open but clear results
                }
            }
        })
        
        // Handle clear button click
        binding.searchCard.setOnClickListener {
            // Prevent closing when clicking on the search card itself
        }
    }

    private fun toggleSearch() {
        val isVisible = binding.searchCard.visibility == View.VISIBLE
        if (isVisible) {
            // Close search
            binding.searchCard.visibility = View.GONE
            binding.editSearch.setText("")
            filterStations("")
            // Hide keyboard
            val imm = getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
            imm.hideSoftInputFromWindow(binding.editSearch.windowToken, 0)
        } else {
            // Open search
            binding.searchCard.visibility = View.VISIBLE
            binding.editSearch.requestFocus()
            // Show keyboard
            val imm = getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
            imm.showSoftInput(binding.editSearch, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
        }
    }

    private fun filterStations(query: String) {
        val filtered = if (query.isBlank()) {
            allStations
        } else {
            allStations.filter { station ->
                station.name.contains(query, ignoreCase = true) ||
                station.frequency.contains(query, ignoreCase = true) ||
                station.city.contains(query, ignoreCase = true)
            }
        }
        stationAdapter.submitList(filtered)
        binding.recyclerViewStations.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
    }


    private fun showDeleteDialog(station: com.example.ethiopianradio.data.model.RadioStation) {
        android.app.AlertDialog.Builder(this)
            .setTitle("Delete Station")
            .setMessage("Are you sure you want to delete \"${station.name} ${station.frequency}\"?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deleteStation(station)
                android.widget.Toast.makeText(this, "Station deleted", android.widget.Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun startPlayerService() {
        val intent = Intent(this, RadioPlayerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun playStation(station: com.example.ethiopianradio.data.model.RadioStation) {
        val intent = Intent(this, RadioPlayerService::class.java).apply {
            action = RadioPlayerService.ACTION_PLAY
            putExtra("station", station)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        binding.miniPlayer.buttonPlayPause.setImageResource(android.R.drawable.ic_media_pause)
        binding.miniPlayer.root.visibility = View.VISIBLE
    }

    private fun togglePlayPause() {
        val intent = Intent(this, RadioPlayerService::class.java).apply {
            action = RadioPlayerService.ACTION_PAUSE
        }
        startService(intent)
        // Toggle icon - this should be updated based on actual playback state
        // For now, just toggle the icon
        val currentIcon = binding.miniPlayer.buttonPlayPause.drawable
        if (currentIcon?.constantState == resources.getDrawable(android.R.drawable.ic_media_pause, theme).constantState) {
            binding.miniPlayer.buttonPlayPause.setImageResource(android.R.drawable.ic_media_play)
        } else {
            binding.miniPlayer.buttonPlayPause.setImageResource(android.R.drawable.ic_media_pause)
        }
    }

    private fun startMiniVinylAnimation() {
        miniVinylAnimator?.cancel()
        binding.miniPlayer.imageMiniVinyl.rotation = 0f
        miniVinylAnimator = ObjectAnimator.ofFloat(
            binding.miniPlayer.imageMiniVinyl,
            View.ROTATION,
            0f,
            360f
        ).apply {
            duration = 15000
            interpolator = LinearInterpolator()
            repeatCount = ObjectAnimator.INFINITE
            start()
        }
    }

    private fun startMiniTickerAnimation() {
        miniTickerAnimator?.cancel()
        val textView = binding.miniPlayer.textNowPlayingMini
        val parentWidth = (textView.parent as? View)?.width ?: 0
        val textWidth = textView.paint.measureText(textView.text.toString())
        
        if (parentWidth > 0 && textWidth > parentWidth) {
            val startX = parentWidth.toFloat()
            val endX = -textWidth
            
            textView.translationX = startX
            miniTickerAnimator = ObjectAnimator.ofFloat(
                textView,
                View.TRANSLATION_X,
                startX,
                endX
            ).apply {
                duration = (20000 * (textWidth / parentWidth)).toLong().coerceAtLeast(10000)
                interpolator = LinearInterpolator()
                repeatCount = ObjectAnimator.INFINITE
                start()
            }
        }
    }

    private fun stopMiniAnimations() {
        miniVinylAnimator?.cancel()
        miniTickerAnimator?.cancel()
        miniVinylAnimator = null
        miniTickerAnimator = null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopMiniAnimations()
    }
}


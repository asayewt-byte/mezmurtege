package com.example.ethiopianradio.ui.admin

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.ethiopianradio.data.model.RadioStation
import com.example.ethiopianradio.databinding.ActivityAdminBinding
import com.example.ethiopianradio.databinding.ItemStationAdminBinding
import com.example.ethiopianradio.ui.viewmodel.RadioStationViewModel
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class AdminActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAdminBinding
    private val viewModel: RadioStationViewModel by viewModels()
    private var selectedImageUri: Uri? = null
    private lateinit var stationsAdapter: StationsListAdapter

    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedImageUri = it
            binding.imagePreview.setImageURI(it)
        }
    }

    private val cameraLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && selectedImageUri != null) {
            binding.imagePreview.setImageURI(selectedImageUri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Show stations list by default
        binding.recyclerViewStations.visibility = View.VISIBLE
        binding.addStationForm.visibility = View.GONE
        binding.toolbar.title = "Manage Stations"

        setupRecyclerView()
        setupClickListeners()
        setupObservers()
    }

    private fun setupRecyclerView() {
        stationsAdapter = StationsListAdapter(
            onDeleteClick = { station ->
                showDeleteDialog(station)
            }
        )
        binding.recyclerViewStations.apply {
            layoutManager = LinearLayoutManager(this@AdminActivity)
            adapter = stationsAdapter
        }
    }

    private fun setupClickListeners() {
        binding.imagePreview.setOnClickListener {
            showImageSourceDialog()
        }

        binding.toolbar.setNavigationOnClickListener {
            finish()
        }

        binding.buttonUpload.setOnClickListener {
            uploadStation()
        }

        binding.fabAdd.setOnClickListener {
            toggleAddForm()
        }
    }

    private fun toggleAddForm() {
        val isFormVisible = binding.addStationForm.visibility == View.VISIBLE
        if (isFormVisible) {
            binding.addStationForm.visibility = View.GONE
            binding.recyclerViewStations.visibility = View.VISIBLE
            binding.toolbar.title = "Manage Stations"
        } else {
            binding.addStationForm.visibility = View.VISIBLE
            binding.recyclerViewStations.visibility = View.GONE
            binding.toolbar.title = "Add Station"
        }
    }

    private fun setupObservers() {
        viewModel.stations.observe(this) { stations ->
            stationsAdapter.submitList(stations)
        }

        viewModel.error.observe(this) { error ->
            error?.let {
                Toast.makeText(this, "Error: $it", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun showDeleteDialog(station: RadioStation) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Delete Station")
            .setMessage("Are you sure you want to delete \"${station.name} ${station.frequency}\"?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deleteStation(station)
                Toast.makeText(this, "Station deleted", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showImageSourceDialog() {
        val options = arrayOf("Gallery", "Camera", "URL")
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Select Image Source")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> pickFromGallery()
                    1 -> takePicture()
                    2 -> showUrlInputDialog()
                }
            }
            .show()
    }

    private fun pickFromGallery() {
        imagePickerLauncher.launch("image/*")
    }

    private fun takePicture() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
            return
        }
        selectedImageUri = createImageUri()
        cameraLauncher.launch(selectedImageUri)
    }

    private fun createImageUri(): Uri {
        val contentValues = android.content.ContentValues().apply {
            put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
        }
        return contentResolver.insert(
            android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            contentValues
        ) ?: Uri.EMPTY
    }

    private fun showUrlInputDialog() {
        val input = android.widget.EditText(this)
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Enter Image URL")
            .setView(input)
            .setPositiveButton("OK") { _, _ ->
                val url = input.text.toString()
                if (url.isNotEmpty()) {
                    binding.editImageUrl.setText(url)
                    Glide.with(this)
                        .load(url)
                        .placeholder(android.R.drawable.ic_menu_gallery)
                        .error(android.R.drawable.ic_menu_report_image)
                        .into(binding.imagePreview)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            takePicture()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
        }
    }

    private fun uploadStation() {
        val name = binding.editStationName.text.toString().trim()
        val frequency = binding.editFrequency.text.toString().trim()
        val city = binding.editCity.text.toString().trim()
        val streamUrl = binding.editStreamUrl.text.toString().trim()
        var imageUrl = binding.editImageUrl.text.toString().trim()

        if (name.isEmpty() || frequency.isEmpty() || city.isEmpty() || streamUrl.isEmpty()) {
            Toast.makeText(this, "Please fill all required fields", Toast.LENGTH_SHORT).show()
            return
        }

        binding.buttonUpload.isEnabled = false
        binding.buttonUpload.text = "Uploading..."

        lifecycleScope.launch {
            try {
                // Upload image if URI is selected
                selectedImageUri?.let { uri ->
                    imageUrl = uploadImageToStorage(uri, name)
                }

                val station = RadioStation(
                    name = name,
                    frequency = frequency,
                    city = city,
                    streamUrl = streamUrl,
                    imageUrl = imageUrl
                )

                viewModel.addStation(station)
                Toast.makeText(this@AdminActivity, "Station uploaded", Toast.LENGTH_SHORT).show()
                // Clear form and show list
                binding.editStationName.setText("")
                binding.editFrequency.setText("")
                binding.editCity.setText("")
                binding.editStreamUrl.setText("")
                binding.editImageUrl.setText("")
                selectedImageUri = null
                binding.imagePreview.setImageDrawable(null)
                toggleAddForm()
            } catch (e: Exception) {
                Toast.makeText(this@AdminActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                binding.buttonUpload.isEnabled = true
                binding.buttonUpload.text = "Upload Station"
            }
        }
    }

    private suspend fun uploadImageToStorage(uri: Uri, stationName: String): String {
        val storage = FirebaseStorage.getInstance()
        val fileName = "${stationName.lowercase().replace(" ", "_")}_${System.currentTimeMillis()}.jpg"
        val ref = storage.reference.child("station_images/$fileName")

        val inputStream: InputStream? = contentResolver.openInputStream(uri)
        val file = File(cacheDir, fileName)
        inputStream?.use { input ->
            FileOutputStream(file).use { output ->
                input.copyTo(output)
            }
        }

        val uploadTask = ref.putFile(Uri.fromFile(file))
        uploadTask.await()
        return ref.downloadUrl.await().toString()
    }

    class StationsListAdapter(
        private val onDeleteClick: (RadioStation) -> Unit
    ) : ListAdapter<RadioStation, StationsListAdapter.StationViewHolder>(StationDiffCallback()) {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StationViewHolder {
            val binding = ItemStationAdminBinding.inflate(
                LayoutInflater.from(parent.context),
                parent,
                false
            )
            return StationViewHolder(binding)
        }

        override fun onBindViewHolder(holder: StationViewHolder, position: Int) {
            holder.bind(getItem(position), onDeleteClick)
        }

        inner class StationViewHolder(
            private val binding: ItemStationAdminBinding
        ) : RecyclerView.ViewHolder(binding.root) {

            fun bind(station: RadioStation, onDeleteClick: (RadioStation) -> Unit) {
                binding.textStationName.text = "${station.name} ${station.frequency}"
                binding.textFrequency.text = station.city

                Glide.with(binding.root.context)
                    .load(station.imageUrl)
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .error(android.R.drawable.ic_menu_report_image)
                    .circleCrop()
                    .into(binding.imageStation)

                binding.buttonDelete.setOnClickListener {
                    onDeleteClick(station)
                }
            }
        }

        class StationDiffCallback : DiffUtil.ItemCallback<RadioStation>() {
            override fun areItemsTheSame(oldItem: RadioStation, newItem: RadioStation): Boolean {
                return oldItem.id == newItem.id
            }

            override fun areContentsTheSame(oldItem: RadioStation, newItem: RadioStation): Boolean {
                return oldItem == newItem
            }
        }
    }
}


package com.example.ethiopianradio.ui.adapter

import android.animation.ObjectAnimator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.LinearInterpolator
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.ethiopianradio.R
import com.example.ethiopianradio.data.model.RadioStation
import com.example.ethiopianradio.databinding.ItemStationBinding

class StationAdapter(
    private val onStationClick: (RadioStation) -> Unit,
    private val onPlayClick: (RadioStation) -> Unit,
    private val onLongClick: (RadioStation) -> Boolean = { false }
) : ListAdapter<RadioStation, StationAdapter.StationViewHolder>(StationDiffCallback()) {

    private val neonColors = listOf(
        R.drawable.vinyl_border_blue,
        R.drawable.vinyl_border_purple,
        R.drawable.vinyl_border_pink,
        R.drawable.vinyl_border_blue,
        R.drawable.vinyl_border_pink,
        R.drawable.vinyl_border_purple
    )

    private val neonColorValues = listOf(
        R.color.neon_blue,
        R.color.neon_purple,
        R.color.neon_pink,
        R.color.neon_blue,
        R.color.neon_pink,
        R.color.neon_purple
    )

    private val neonButtonColors = listOf(
        R.color.neon_pink,
        R.color.neon_green,
        R.color.neon_blue,
        R.color.neon_purple,
        R.color.neon_blue,
        R.color.neon_green
    )

    private val neonTickerColors = listOf(
        R.color.neon_pink,
        R.color.neon_green,
        R.color.neon_blue,
        R.color.neon_purple,
        R.color.neon_blue,
        R.color.neon_green
    )

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StationViewHolder {
        val binding = ItemStationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return StationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StationViewHolder, position: Int) {
        holder.bind(getItem(position), position, onStationClick, onPlayClick, onLongClick)
    }

    inner class StationViewHolder(
        private val binding: ItemStationBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private var vinylAnimator: ObjectAnimator? = null
        private var tickerAnimator: ObjectAnimator? = null
        private var isPlaying = false

        fun bind(
            station: RadioStation,
            position: Int,
            onStationClick: (RadioStation) -> Unit,
            onPlayClick: (RadioStation) -> Unit,
            onLongClick: (RadioStation) -> Boolean
        ) {
            binding.apply {
                val context = root.context
                val borderDrawable = neonColors[position % neonColors.size]
                val colorRes = neonColorValues[position % neonColorValues.size]
                val colorValue = ContextCompat.getColor(context, colorRes)

                // Set vinyl border
                imageVinylBorder.setImageResource(borderDrawable)

                // Set station name with neon color and glow effect
                textStationName.setTextColor(colorValue)
                textStationName.text = "${station.name} ${station.frequency}"

                // Set city and listeners (random for demo)
                textCity.text = station.city
                val listeners = "${(Math.random() * 5 + 0.5).toInt()}M listeners"
                textListeners.text = listeners

                // Set now playing text with different neon color
                val tickerColorRes = neonTickerColors[position % neonTickerColors.size]
                val tickerColorValue = ContextCompat.getColor(context, tickerColorRes)
                textNowPlaying.setTextColor(tickerColorValue)
                val nowPlayingText = "Now Playing: ${station.name} - Live Stream    "
                textNowPlaying.text = nowPlayingText

                // Load station image
                Glide.with(context)
                    .load(station.imageUrl)
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .error(android.R.drawable.ic_menu_report_image)
                    .circleCrop()
                    .into(imageStation)

                // Set play button color (different from station name)
                val buttonColorRes = neonButtonColors[position % neonButtonColors.size]
                val buttonColorValue = ContextCompat.getColor(context, buttonColorRes)
                buttonPlay.backgroundTintList = ContextCompat.getColorStateList(context, buttonColorRes)

                // Start vinyl rotation animation (always rotating for visual effect)
                startVinylAnimation()

                // Start ticker scrolling animation
                textNowPlaying.post {
                    startTickerAnimation()
                }

                // Set click listeners
                root.setOnClickListener {
                    onStationClick(station)
                }

                root.setOnLongClickListener {
                    onLongClick(station)
                }

                buttonPlay.setOnClickListener {
                    isPlaying = !isPlaying
                    updatePlayButton(isPlaying)
                    onPlayClick(station)
                }
            }
        }

        private fun startVinylAnimation() {
            vinylAnimator?.cancel()
            binding.vinylContainer.rotation = 0f
            vinylAnimator = ObjectAnimator.ofFloat(
                binding.vinylContainer,
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

        private fun startTickerAnimation() {
            tickerAnimator?.cancel()
            val textView = binding.textNowPlaying
            val parentWidth = (textView.parent as? View)?.width ?: 0
            val textWidth = textView.paint.measureText(textView.text.toString())
            
            if (parentWidth > 0 && textWidth > parentWidth) {
                // Text is longer than container, animate it
                val startX = parentWidth.toFloat()
                val endX = -textWidth
                
                textView.translationX = startX
                tickerAnimator = ObjectAnimator.ofFloat(
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

        private fun updatePlayButton(playing: Boolean) {
            val iconRes = if (playing) {
                android.R.drawable.ic_media_pause
            } else {
                android.R.drawable.ic_media_play
            }
            binding.buttonPlay.setImageResource(iconRes)
        }

        fun onViewRecycled() {
            vinylAnimator?.cancel()
            tickerAnimator?.cancel()
            vinylAnimator = null
            tickerAnimator = null
        }
    }

    override fun onViewRecycled(holder: StationViewHolder) {
        holder.onViewRecycled()
        super.onViewRecycled(holder)
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

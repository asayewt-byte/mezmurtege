import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../models/radio_station.dart';
import '../data/radio_stations.dart';
import '../services/firebase_service.dart';
import 'admin_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> with WidgetsBindingObserver {
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  bool _isLoading = false;
  String? _errorMessage;
  RadioStation? currentPlayingStation;
  final FirebaseService _firebaseService = FirebaseService();
  List<RadioStation> _stations = [];
  bool _isLoadingStations = true;
  Timer? _reconnectTimer;
  bool _isReconnecting = false;
  bool _userPaused = false; // Track if user manually paused
  StreamSubscription<PlayerState>? _playerStateSubscription;
  StreamSubscription<PlaybackEvent>? _playbackEventSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _audioPlayer = AudioPlayer();
    _initAudioPlayer();
    _loadStations();
    // Enable wakelock to keep device awake during playback
    WakelockPlus.enable();
  }

  Future<void> _loadStations() async {
    try {
      setState(() {
        _isLoadingStations = true;
      });

      // Try to load from Firebase first
      try {
        final stations = await _firebaseService.getStationsOnce();
        if (stations.isNotEmpty) {
          setState(() {
            _stations = stations;
            if (currentPlayingStation == null && stations.isNotEmpty) {
              currentPlayingStation = stations.first;
            }
            _isLoadingStations = false;
          });
          return;
        }
      } catch (e) {
        print('Firebase error: $e, using local data');
      }

      // Fallback to local data if Firebase fails or is empty
      setState(() {
        _stations = favoriteStations;
        currentPlayingStation = nowPlayingStation;
        _isLoadingStations = false;
      });
    } catch (e) {
      print('Error loading stations: $e');
      setState(() {
        _stations = favoriteStations;
        currentPlayingStation = nowPlayingStation;
        _isLoadingStations = false;
      });
    }
  }

  void _initAudioPlayer() {
    // Listen to player state changes
    _playerStateSubscription = _audioPlayer.playerStateStream.listen((state) {
      if (mounted) {
        final wasPlaying = _isPlaying;
        setState(() {
          _isPlaying = state.playing;
          _isLoading = state.processingState == ProcessingState.loading ||
              state.processingState == ProcessingState.buffering;
          
          // Clear error when playing successfully
          if (state.playing && state.processingState == ProcessingState.ready) {
            _errorMessage = null;
            _isReconnecting = false;
          }
          
          // Detect unexpected stops and attempt reconnection
          // Only reconnect if playback stopped but we're still in a playing state
          // (not idle, which would indicate user pause or completion)
          // And only if user didn't manually pause
          if (wasPlaying && !state.playing && 
              state.processingState != ProcessingState.idle &&
              state.processingState != ProcessingState.completed &&
              currentPlayingStation != null &&
              !_isReconnecting &&
              !_userPaused) {
            print('Playback stopped unexpectedly (state: ${state.processingState}), attempting to reconnect...');
            _scheduleReconnect();
          }
          
          // Reset user pause flag when playback starts again
          if (state.playing) {
            _userPaused = false;
          }
        });
      }
    });

    // Listen to playback events
    _playbackEventSubscription = _audioPlayer.playbackEventStream.listen((event) {
      if (mounted) {
        // Check for errors in processing state
        if (event.processingState == ProcessingState.loading || 
            event.processingState == ProcessingState.buffering) {
          setState(() {
            _isLoading = true;
          });
        } else if (event.processingState == ProcessingState.ready) {
          setState(() {
            _isLoading = false;
            _errorMessage = null;
            _isReconnecting = false;
          });
        }
        // Note: We don't reconnect on idle state as it could be a user pause
        // Reconnection is handled by playerStateStream which has more context
      }
    }, onError: (error, stackTrace) {
      if (mounted) {
        print('Playback error: $error');
        print('Stack trace: $stackTrace');
        
        // Only show error if not reconnecting
        if (!_isReconnecting) {
          setState(() {
            _errorMessage = 'Stream error: ${error.toString()}';
            _isPlaying = false;
            _isLoading = false;
          });
          
          // Attempt to reconnect after error
          if (currentPlayingStation != null) {
            _scheduleReconnect();
          }
        }
      }
    });
  }
  
  void _scheduleReconnect() {
    // Cancel any existing reconnect timer
    _reconnectTimer?.cancel();
    
    // Don't reconnect if already reconnecting or no station playing
    if (_isReconnecting || currentPlayingStation == null) {
      return;
    }
    
    setState(() {
      _isReconnecting = true;
    });
    
    // Wait 2 seconds before attempting reconnect
    _reconnectTimer = Timer(const Duration(seconds: 2), () {
      if (mounted && currentPlayingStation != null && !_isPlaying) {
        print('Attempting to reconnect to stream...');
        _playStation(currentPlayingStation!, isReconnect: true);
      }
    });
  }

  Future<void> _playStation(RadioStation station, {bool isReconnect = false}) async {
    if (station.streamUrl == null || station.streamUrl!.isEmpty) {
      setState(() {
        _errorMessage = 'No stream URL available for this station';
        _isReconnecting = false;
      });
      return;
    }

    // Check network connectivity first
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult == ConnectivityResult.none) {
      setState(() {
        _errorMessage = 'No internet connection. Please check your network settings.';
        _isLoading = false;
        _isReconnecting = false;
      });
      return;
    }

    if (!isReconnect) {
      setState(() {
        currentPlayingStation = station;
        _isLoading = true;
        _errorMessage = null;
        _isReconnecting = false;
        _userPaused = false; // Reset pause flag for new station
      });
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _userPaused = false; // Reset pause flag on reconnect
      });
    }

    try {
      final streamUrl = station.streamUrl!;
      print('Attempting to play stream: $streamUrl (reconnect: $isReconnect)');
      
      // Stop any existing playback first (unless reconnecting)
      if (!isReconnect) {
        try {
          await _audioPlayer.stop();
          await Future.delayed(const Duration(milliseconds: 500));
        } catch (e) {
          // Ignore stop errors
        }
      }
      
      // Use AudioSource.uri with better configuration for streaming
      try {
        final audioSource = AudioSource.uri(
          Uri.parse(streamUrl),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Icy-MetaData': '1',
            'Connection': 'keep-alive',
          },
        );
        
        await _audioPlayer.setAudioSource(audioSource, preload: false);
        
        // Set playback parameters for streaming
        await _audioPlayer.setSpeed(1.0);
        
        // Start playback
        await _audioPlayer.play();
        
        print('Playback started successfully');
        setState(() {
          _isReconnecting = false;
        });
        return;
      } catch (sourceError) {
        print('AudioSource failed: $sourceError');
        
        // Fallback: Try with setUrl
        try {
          await _audioPlayer.setUrl(streamUrl);
          await _audioPlayer.play();
          print('Playback started with setUrl');
          setState(() {
            _isReconnecting = false;
          });
          return;
        } catch (urlError) {
          print('setUrl also failed: $urlError');
          throw sourceError;
        }
      }
    } catch (e, stackTrace) {
      print('Error playing station: $e');
      print('Stack trace: $stackTrace');
      
      if (mounted) {
        final errorMsg = e.toString().toLowerCase();
        String userFriendlyError = 'Failed to play station';
        
        if (errorMsg.contains('unknownhostexception') || errorMsg.contains('unable to resolve host')) {
          userFriendlyError = 'Network Error: Emulator has no internet access.\n\nTo fix:\n1. Restart the emulator\n2. Check Android Studio AVD settings\n3. Ensure your computer has internet\n4. Try: Cold Boot Now in AVD Manager';
        } else if (errorMsg.contains('socketexception') || errorMsg.contains('network')) {
          userFriendlyError = 'Network error: Check your internet connection';
        } else if (errorMsg.contains('404') || errorMsg.contains('not found')) {
          userFriendlyError = 'Stream not found: URL may be invalid';
        } else if (errorMsg.contains('401') || errorMsg.contains('403')) {
          userFriendlyError = 'Access denied: Stream URL may have expired';
        } else if (errorMsg.contains('0') || errorMsg.contains('source')) {
          userFriendlyError = 'Stream error: The URL token may have expired. Please get a fresh stream URL from the radio provider.';
        } else if (errorMsg.contains('timeout')) {
          userFriendlyError = 'Connection timeout: Stream server not responding';
        }
        
        setState(() {
          if (!isReconnect) {
            _errorMessage = userFriendlyError;
          }
          _isLoading = false;
          _isPlaying = false;
          _isReconnecting = false;
        });
        
        // If reconnection failed, try one more time after delay
        if (isReconnect && currentPlayingStation != null) {
          Future.delayed(const Duration(seconds: 5), () {
            if (mounted && currentPlayingStation != null && !_isPlaying) {
              _scheduleReconnect();
            }
          });
        }
      }
    }
  }

  Future<void> _togglePlayPause() async {
    if (_isPlaying) {
      // User manually paused
      setState(() {
        _userPaused = true;
      });
      await _audioPlayer.pause();
    } else {
      // User wants to resume
      setState(() {
        _userPaused = false;
      });
      if (currentPlayingStation != null && currentPlayingStation!.streamUrl != null) {
        if (_audioPlayer.playing) {
          await _audioPlayer.play();
        } else {
          await _playStation(currentPlayingStation!);
        }
      }
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // Handle app lifecycle changes
    if (state == AppLifecycleState.paused) {
      // App is in background - keep playing with background service
      print('App paused - continuing playback in background');
    } else if (state == AppLifecycleState.resumed) {
      // App is in foreground
      print('App resumed - checking playback state');
      // Check if playback stopped and restart if needed
      if (currentPlayingStation != null && !_isPlaying && !_isReconnecting) {
        // Check current player state directly (not a Future)
        final playerState = _audioPlayer.playerState;
        if (playerState.processingState == ProcessingState.idle && 
            currentPlayingStation != null) {
          _scheduleReconnect();
        }
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _reconnectTimer?.cancel();
    _playerStateSubscription?.cancel();
    _playbackEventSubscription?.cancel();
    WakelockPlus.disable();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Column(
        children: [
          // Top App Bar
          SafeArea(
            bottom: false,
            child: _buildAppBar(isDark),
          ),
          // Main Content: Stations Grid
          Expanded(
            child: _buildStationsGrid(isDark),
          ),
        ],
      ),
      // Mini Player
      bottomNavigationBar: SafeArea(
        top: false,
        child: _buildMiniPlayer(isDark),
      ),
    );
  }

  Widget _buildAppBar(bool isDark) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF102210).withOpacity(0.8)
                : const Color(0xFFF6F8F6).withOpacity(0.8),
          ),
          child: Row(
            children: [
              // Search button
              SizedBox(
                width: 48,
                height: 48,
                child: IconButton(
                  onPressed: () {
                    _showSearchDialog(context, isDark);
                  },
                  icon: Icon(
                    Icons.search,
                    color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF18181B),
                  ),
                ),
              ),
              // Title
              Expanded(
                child: Text(
                  'Ethiopian Radio',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
                    letterSpacing: -0.015,
                  ),
                ),
              ),
              // Add button - Navigate to Admin Screen
              SizedBox(
                width: 48,
                child: IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AdminScreen(),
                      ),
                    ).then((_) {
                      // Reload stations after returning from admin screen
                      _loadStations();
                    });
                  },
                  icon: Icon(
                    Icons.add_circle_outline,
                    color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF18181B),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStationsGrid(bool isDark) {
    if (_isLoadingStations) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF13EC13),
        ),
      );
    }

    if (_stations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.radio_outlined,
              size: 64,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
            ),
            const SizedBox(height: 16),
            Text(
              'No stations available',
              style: TextStyle(
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap + to add a station',
              style: TextStyle(
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        16 + MediaQuery.of(context).padding.bottom + 100,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: _stations.length,
      itemBuilder: (context, index) {
        final station = _stations[index];
        return _buildStationCard(station, isDark);
      },
    );
  }

  Widget _buildStationCard(RadioStation station, bool isDark) {
    return InkWell(
      onTap: () {
        _playStation(station);
      },
      borderRadius: BorderRadius.circular(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Station Image - Square aspect ratio
          AspectRatio(
            aspectRatio: 1.0,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF13EC13).withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  station.imageUrl,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      color: isDark
                          ? const Color(0xFF18181B)
                          : const Color(0xFFE4E4E7),
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                              : null,
                          strokeWidth: 2,
                          color: const Color(0xFF13EC13),
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: isDark
                          ? const Color(0xFF18181B)
                          : const Color(0xFFE4E4E7),
                      child: Icon(
                        Icons.radio,
                        color: const Color(0xFF13EC13),
                        size: 40,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Station Name
          SizedBox(
            height: 20,
            child: Text(
              station.name,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 2),
          // Station City
          SizedBox(
            height: 18,
            child: Text(
              station.city,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.normal,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniPlayer(bool isDark) {
    return Container(
      margin: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: 8 + MediaQuery.of(context).padding.bottom,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: isDark
                  ? const Color(0xFF18181B).withOpacity(0.5)
                  : const Color(0xFFE4E4E7).withOpacity(0.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Station Image
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      currentPlayingStation!.imageUrl,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          color: isDark
                              ? const Color(0xFF18181B)
                              : const Color(0xFFE4E4E7),
                          child: Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: const Color(0xFF13EC13),
                              ),
                            ),
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: isDark
                              ? const Color(0xFF18181B)
                              : const Color(0xFFE4E4E7),
                          child: Icon(
                            Icons.radio,
                            color: const Color(0xFF13EC13),
                            size: 28,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Station Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        currentPlayingStation!.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isLoading
                            ? 'Loading...'
                            : _errorMessage != null
                                ? 'Error'
                                : _isPlaying
                                    ? 'Now Playing...'
                                    : 'Paused',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.normal,
                          color: _errorMessage != null
                              ? Colors.red
                              : const Color(0xFF13EC13),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (_errorMessage != null)
                        Text(
                          _errorMessage!,
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.red,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                // Play/Pause Button
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFF13EC13),
                    shape: BoxShape.circle,
                  ),
                  child: _isLoading
                      ? const Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF102210),
                            ),
                          ),
                        )
                      : IconButton(
                          onPressed: _togglePlayPause,
                          icon: Icon(
                            _isPlaying ? Icons.pause : Icons.play_arrow,
                            color: const Color(0xFF102210),
                            size: 24,
                          ),
                          padding: EdgeInsets.zero,
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  void _showSearchDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Search Stations',
          style: TextStyle(
            color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
            fontWeight: FontWeight.bold,
          ),
        ),
        content: TextField(
          autofocus: true,
          style: TextStyle(
            color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
          ),
          decoration: InputDecoration(
            hintText: 'Search by name or city...',
            hintStyle: TextStyle(
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: const Color(0xFF13EC13),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFF13EC13),
                width: 2,
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Search functionality coming soon!'),
                  backgroundColor: const Color(0xFF13EC13),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text(
              'Search',
              style: TextStyle(
                color: Color(0xFF13EC13),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddStationDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Add Station',
          style: TextStyle(
            color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              style: TextStyle(
                color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
              ),
              decoration: InputDecoration(
                labelText: 'Station Name',
                labelStyle: TextStyle(
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: Color(0xFF13EC13),
                    width: 2,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              style: TextStyle(
                color: isDark ? const Color(0xFFFAFAFA) : const Color(0xFF18181B),
              ),
              decoration: InputDecoration(
                labelText: 'City',
                labelStyle: TextStyle(
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: Color(0xFF13EC13),
                    width: 2,
                  ),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Station added to favorites!'),
                  backgroundColor: const Color(0xFF13EC13),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text(
              'Add',
              style: TextStyle(
                color: Color(0xFF13EC13),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}


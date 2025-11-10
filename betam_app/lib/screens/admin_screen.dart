import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/firebase_service.dart';
import '../theme/app_theme.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _frequencyController = TextEditingController();
  final _cityController = TextEditingController();
  final _streamUrlController = TextEditingController();
  final _firebaseService = FirebaseService();
  final _imagePicker = ImagePicker();
  
  File? _selectedImage;
  String? _imageUrl; // For direct URL input
  bool _isUploading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _frequencyController.dispose();
    _cityController.dispose();
    _streamUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking image: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error taking photo: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _uploadStation() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      await _firebaseService.addStation(
        name: _nameController.text.trim(),
        frequency: _frequencyController.text.trim(),
        city: _cityController.text.trim(),
        streamUrl: _streamUrlController.text.trim(),
        imageFile: _selectedImage,
        imageUrl: _imageUrl, // Use URL if provided and no file selected
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Station added successfully!'),
            backgroundColor: Color(0xFF13EC13),
          ),
        );

        // Clear form
        _nameController.clear();
        _frequencyController.clear();
        _cityController.clear();
        _streamUrlController.clear();
        setState(() {
          _selectedImage = null;
          _imageUrl = null;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Radio Station'),
        backgroundColor: isDark ? const Color(0xFF102210) : const Color(0xFFF6F8F6),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Station Image
                GestureDetector(
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      builder: (context) => SafeArea(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.photo_library),
                              title: const Text('Choose from Gallery'),
                              onTap: () {
                                Navigator.pop(context);
                                setState(() {
                                  _imageUrl = null; // Clear URL when picking file
                                });
                                _pickImage();
                              },
                            ),
                            ListTile(
                              leading: const Icon(Icons.camera_alt),
                              title: const Text('Take Photo'),
                              onTap: () {
                                Navigator.pop(context);
                                setState(() {
                                  _imageUrl = null; // Clear URL when taking photo
                                });
                                _takePhoto();
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  child: Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : const Color(0xFFE4E4E7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF13EC13).withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: _selectedImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.file(
                              _selectedImage!,
                              fit: BoxFit.cover,
                            ),
                          )
                        : _imageUrl != null && _imageUrl!.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Image.network(
                                  _imageUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.error_outline,
                                          size: 48,
                                          color: Colors.red.shade300,
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Invalid URL',
                                          style: TextStyle(
                                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                  loadingBuilder: (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return const Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF13EC13),
                                      ),
                                    );
                                  },
                                ),
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.add_photo_alternate,
                                    size: 64,
                                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Tap to upload image\nOR enter URL below',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Text(
                    'Tip: Use Image URL field if Firebase Storage is not enabled',
                    style: TextStyle(
                      fontSize: 10,
                      color: isDark ? const Color(0xFF71717A) : const Color(0xFF71717A),
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),

                // Station Name
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Station Name *',
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
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter station name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Frequency
                TextFormField(
                  controller: _frequencyController,
                  decoration: InputDecoration(
                    labelText: 'Frequency (e.g., 102.1 or Online) *',
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
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter frequency';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // City
                TextFormField(
                  controller: _cityController,
                  decoration: InputDecoration(
                    labelText: 'City *',
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
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter city';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Stream URL
                TextFormField(
                  controller: _streamUrlController,
                  decoration: InputDecoration(
                    labelText: 'Stream URL *',
                    hintText: 'https://stream.example.com/radio',
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
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter stream URL';
                    }
                    final uri = Uri.tryParse(value);
                    if (uri == null || !uri.hasScheme) {
                      return 'Please enter a valid URL (e.g., https://...)';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Image URL (Alternative to file upload)
                TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Image URL (Optional - if not uploading file)',
                    hintText: 'https://example.com/station-logo.jpg',
                    helperText: 'Use this if Firebase Storage is not enabled',
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
                  onChanged: (value) {
                    setState(() {
                      _imageUrl = value.trim().isEmpty ? null : value.trim();
                      // Clear selected image if URL is provided
                      if (_imageUrl != null && _imageUrl!.isNotEmpty) {
                        _selectedImage = null;
                      }
                    });
                  },
                ),
                const SizedBox(height: 32),

                // Upload Button
                ElevatedButton(
                  onPressed: _isUploading ? null : _uploadStation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF13EC13),
                    foregroundColor: const Color(0xFF102210),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isUploading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF102210),
                          ),
                        )
                      : const Text(
                          'Upload Station',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


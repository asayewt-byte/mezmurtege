import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../models/radio_station.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Collection reference for stations
  CollectionReference get _stationsRef => _firestore.collection('stations');

  // Get all stations
  Stream<List<RadioStation>> getStations() {
    return _stationsRef
        .orderBy('name')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => _stationFromFirestore(doc))
            .toList());
  }

  // Get stations once (not stream)
  Future<List<RadioStation>> getStationsOnce() async {
    final snapshot = await _stationsRef.orderBy('name').get();
    return snapshot.docs.map((doc) => _stationFromFirestore(doc)).toList();
  }

  // Add a new station
  Future<String> addStation({
    required String name,
    required String frequency,
    required String city,
    required String streamUrl,
    File? imageFile,
    String? imageUrl, // Allow direct URL if not using Storage
  }) async {
    try {
      String? finalImageUrl = imageUrl;

      // Try to upload image to Storage if file is provided
      if (imageFile != null) {
        try {
          finalImageUrl = await uploadStationImage(imageFile, name);
        } catch (e) {
          print('Storage upload failed: $e');
          print('Tip: Enable Firebase Storage billing or use image URL instead');
          // If Storage is not available, you can:
          // 1. Store image as base64 (not recommended for large images)
          // 2. Use external image hosting
          // 3. Just store the URL if user provides one
          throw Exception('Image upload failed: $e. Please enable Firebase Storage or use an image URL.');
        }
      }

      // Add station to Firestore
      final docRef = await _stationsRef.add({
        'name': name,
        'frequency': frequency,
        'city': city,
        'streamUrl': streamUrl,
        'imageUrl': finalImageUrl ?? '',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      return docRef.id;
    } catch (e) {
      throw Exception('Failed to add station: $e');
    }
  }

  // Update a station
  Future<void> updateStation({
    required String stationId,
    String? name,
    String? frequency,
    String? city,
    String? streamUrl,
    File? imageFile,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (name != null) updateData['name'] = name;
      if (frequency != null) updateData['frequency'] = frequency;
      if (city != null) updateData['city'] = city;
      if (streamUrl != null) updateData['streamUrl'] = streamUrl;

      // Upload new image if provided
      if (imageFile != null) {
        final imageUrl = await uploadStationImage(imageFile, name ?? 'station');
        updateData['imageUrl'] = imageUrl;
      }

      await _stationsRef.doc(stationId).update(updateData);
    } catch (e) {
      throw Exception('Failed to update station: $e');
    }
  }

  // Delete a station
  Future<void> deleteStation(String stationId) async {
    try {
      // Get station data to delete image
      final doc = await _stationsRef.doc(stationId).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        final imageUrl = data['imageUrl'] as String?;

        // Delete image from storage if exists
        if (imageUrl != null && imageUrl.isNotEmpty) {
          try {
            final ref = _storage.refFromURL(imageUrl);
            await ref.delete();
          } catch (e) {
            print('Error deleting image: $e');
          }
        }

        // Delete station document
        await _stationsRef.doc(stationId).delete();
      }
    } catch (e) {
      throw Exception('Failed to delete station: $e');
    }
  }

  // Upload station image
  Future<String> uploadStationImage(File imageFile, String stationName) async {
    try {
      final fileName = '${stationName.toLowerCase().replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final ref = _storage.ref().child('station_images/$fileName');

      await ref.putFile(imageFile);
      final downloadUrl = await ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      throw Exception('Failed to upload image: $e');
    }
  }

  // Convert Firestore document to RadioStation
  RadioStation _stationFromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return RadioStation(
      id: doc.id,
      name: data['name'] ?? '',
      frequency: data['frequency'] ?? '',
      city: data['city'] ?? '',
      imageUrl: data['imageUrl'] ?? '',
      streamUrl: data['streamUrl'] ?? '',
    );
  }
}


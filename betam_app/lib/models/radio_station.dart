class RadioStation {
  final String id;
  final String name;
  final String frequency;
  final String city;
  final String imageUrl;
  final String? streamUrl;

  RadioStation({
    required this.id,
    required this.name,
    required this.frequency,
    required this.city,
    required this.imageUrl,
    this.streamUrl,
  });
}


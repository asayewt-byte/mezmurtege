# Flutter wrapper
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

# Play Core ignore warnings
-dontwarn com.google.android.play.core.**

# GSON (if used indirectly by Firebase)
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.stream.** { *; }

# Firebase (minimum safe rules)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep required Google Play services parts
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ExoPlayer
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# Your app package
-keep class com.example.ethiopianradio.** { *; }

# Keep data classes
-keep class com.example.ethiopianradio.data.model.** { *; }
-keepclassmembers class com.example.ethiopianradio.data.model.** {
    <fields>;
}


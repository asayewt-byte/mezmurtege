# Flutter core (minimal)
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

-dontwarn com.google.android.play.core.**

# Gson uses generic type information stored in a class file when working with fields. Proguard
# removes such information by default, so configure it to keep all of it.
-keepattributes Signature

# For using GSON @Expose annotation
-keepattributes *Annotation*

# Gson specific classes
-dontwarn sun.misc.**
-keep class com.google.gson.stream.** { *; }

# Firebase core
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep just_audio classes
-keep class com.ryanheise.just_audio.** { *; }
-dontwarn com.ryanheise.just_audio.**

# Keep just_audio_background classes
-keep class com.ryanheise.just_audio_background.** { *; }
-dontwarn com.ryanheise.just_audio_background.**

# Keep connectivity_plus classes
-keep class dev.fluttercommunity.plus.connectivity.** { *; }
-dontwarn dev.fluttercommunity.plus.connectivity.**

# Keep wakelock_plus classes
-keep class dev.fluttercommunity.plus.wakelock.** { *; }
-dontwarn dev.fluttercommunity.plus.wakelock.**

# Application classes
-keep class com.example.betam_app.** { *; }


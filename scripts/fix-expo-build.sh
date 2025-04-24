#!/bin/bash

# Backup the original file
cp node_modules/expo/android/build.gradle node_modules/expo/android/build.gradle.bak

# Create the new build.gradle
cat > node_modules/expo/android/build.gradle << 'EOL'
def safeExtGet(prop, fallback) { rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback }

apply plugin: 'com.android.library'

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    ndkVersion "26.1.10909125"
    
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
        versionCode 1
        versionName "1.0"
    }
    namespace "expo.modules"
    lintOptions { abortOnError false }
}
EOL

echo "Expo build.gradle has been updated" 
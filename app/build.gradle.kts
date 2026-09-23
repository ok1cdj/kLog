plugins {
    // AGP 9 compiles Kotlin via its built-in support — no separate kotlin plugin.
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.ok1cdj.klog"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.ok1cdj.klog"
        minSdk = 30
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Signing is configured in F2.2 (CI, keystore from secrets).
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Copy the built web app (web/dist) into the APK assets before packaging.
// The web build uses base /kLog/, matching the WebViewAssetLoader mount point.
val copyWebAssets = tasks.register<Copy>("copyWebAssets") {
    from(rootProject.layout.projectDirectory.dir("web/dist"))
    into(layout.projectDirectory.dir("src/main/assets/kLog"))
}
tasks.named("preBuild") { dependsOn(copyWebAssets) }

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.webkit)
}

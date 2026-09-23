plugins {
    // AGP 9 has built-in Kotlin support — the JetBrains kotlin.android plugin must
    // NOT be applied alongside it.
    alias(libs.plugins.android.application) apply false
}

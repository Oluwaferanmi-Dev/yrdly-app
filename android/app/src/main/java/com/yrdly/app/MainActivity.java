package com.yrdly.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Handle safe areas and system bars
        setupSafeAreaHandling();
    }
    
    private void setupSafeAreaHandling() {
        // Get the root view
        View rootView = findViewById(android.R.id.content);
        
        if (rootView != null) {
            rootView.setOnApplyWindowInsetsListener((v, insets) -> {
                // Apply insets to handle safe areas
                int topInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;
                int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                int leftInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
                int rightInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
                
                // Apply padding to handle safe areas
                v.setPadding(leftInset, topInset, rightInset, bottomInset);
                
                return insets;
            });
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        
        if (hasFocus) {
            // Hide system bars for immersive experience
            hideSystemUI();
        }
    }
    
    private void hideSystemUI() {
        // For Android 11+ (API 30+)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            getWindow().getInsetsController().hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            getWindow().getInsetsController().setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } else {
            // For older versions
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}

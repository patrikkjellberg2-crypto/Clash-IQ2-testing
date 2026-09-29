package com.clashiq.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private long launchStartedAt;
    private View welcomeOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        launchStartedAt = System.currentTimeMillis();

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        boolean firstLaunch = !getSharedPreferences("clash_iq_prefs", Context.MODE_PRIVATE)
                .getBoolean("welcome_shown", false);
        long splashDuration = firstLaunch ? 3000L : 1800L;

        splashScreen.setKeepOnScreenCondition(() ->
                System.currentTimeMillis() - launchStartedAt < splashDuration);

        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.rgb(7, 9, 13));
        getWindow().setNavigationBarColor(Color.rgb(7, 9, 13));

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets bars = insets.getInsets(
                    WindowInsetsCompat.Type.statusBars()
                            | WindowInsetsCompat.Type.navigationBars()
                            | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(content);

        if (firstLaunch) {
            handler.postDelayed(this::showWelcome, splashDuration + 120L);
        }
    }

    private void showWelcome() {
        View root = findViewById(android.R.id.content);
        if (!(root instanceof ViewGroup) || welcomeOverlay != null) return;

        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.rgb(7, 9, 13));
        overlay.setAlpha(0f);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);

        ImageView icon = new ImageView(this);
        icon.setImageResource(com.clashiq.app.R.mipmap.ic_launcher);
        box.addView(icon, new LinearLayout.LayoutParams(dp(104), dp(104)));

        TextView title = text("WELCOME, COMMANDER", 24, Color.WHITE);
        title.setGravity(Gravity.CENTER);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        box.addView(title, new LinearLayout.LayoutParams(-2, -2));

        TextView subtitle = text("AI-powered Clash intelligence", 14, Color.rgb(170, 175, 185));
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(-2, -2);
        subParams.topMargin = dp(8);
        box.addView(subtitle, subParams);

        FrameLayout.LayoutParams boxParams = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER);
        overlay.addView(box, boxParams);
        ((ViewGroup) root).addView(overlay, new ViewGroup.LayoutParams(-1, -1));

        welcomeOverlay = overlay;
        overlay.animate().alpha(1f).setDuration(250).start();

        handler.postDelayed(() -> {
            getSharedPreferences("clash_iq_prefs", Context.MODE_PRIVATE)
                    .edit().putBoolean("welcome_shown", true).apply();
            overlay.animate().alpha(0f).setDuration(420)
                    .withEndAction(() -> {
                        ViewGroup parent = (ViewGroup) overlay.getParent();
                        if (parent != null) parent.removeView(overlay);
                        welcomeOverlay = null;
                    }).start();
        }, 1600L);
    }

    private TextView text(String value, float size, int color) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color);
        return v;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}

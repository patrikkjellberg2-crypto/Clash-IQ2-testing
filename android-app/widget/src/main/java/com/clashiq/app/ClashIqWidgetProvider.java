package com.clashiq.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class ClashIqWidgetProvider extends AppWidgetProvider {
    private static final String API_BASE =
        "https://clash-iq2-testing.onrender.com/api/clash/dashboard";
    private static final String CLAN_TAG = "#2Q0Q82C9R";
    private static final int UPDATE_MINUTES = 30;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id);
        scheduleUpdates(context);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleUpdates(context);
    }

    private static void scheduleUpdates(Context context) {
        android.app.AlarmManager alarms =
            (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, ClashIqWidgetProvider.class);
        PendingIntent pending = PendingIntent.getBroadcast(
            context, 7401, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        long interval = UPDATE_MINUTES * 60L * 1000L;
        alarms.setInexactRepeating(
            android.app.AlarmManager.RTC,
            System.currentTimeMillis() + interval,
            interval,
            pending
        );
    }

    private static void update(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.clash_iq_widget);
        views.setTextViewText(R.id.widget_clan, "BHABE DHEMONS");
        views.setTextViewText(R.id.widget_status, "Updating…");

        Intent open = new Intent(Intent.ACTION_VIEW,
            Uri.parse("https://clash-iq2-testing.onrender.com/war-center"));
        PendingIntent click = PendingIntent.getActivity(
            context, 7402, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, click);
        manager.updateAppWidget(id, views);

        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                String encoded = URLEncoder.encode(CLAN_TAG, StandardCharsets.UTF_8.name());
                URL url = new URL(API_BASE + "?clanTag=" + encoded);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(8000);
                connection.setRequestMethod("GET");

                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) body.append(line);
                } finally {
                    connection.disconnect();
                }

                JSONObject root = new JSONObject(body.toString());
                JSONObject war = root.optJSONObject("currentWar");
                String status = "No active war";
                String score = "—";
                String destruction = "—";
                String attacks = "—";
                String timer = "—";

                if (war != null) {
                    status = war.optString("state", "war").toUpperCase();
                    score = war.optInt("stars", 0) + " ⭐";
                    destruction = String.format(
                        java.util.Locale.US, "%.1f%%",
                        war.optDouble("destruction", 0)
                    );
                    attacks = String.valueOf(war.optInt("attacksRemaining", 0));
                    timer = remainingTime(war.optString("endTime", ""));
                }

                final String fStatus = status;
                final String fScore = score;
                final String fDestruction = destruction;
                final String fAttacks = attacks;
                final String fTimer = timer;

                new Handler(Looper.getMainLooper()).post(() -> {
                    views.setTextViewText(R.id.widget_status, fStatus);
                    views.setTextViewText(R.id.widget_score, fScore);
                    views.setTextViewText(R.id.widget_destruction, fDestruction);
                    views.setTextViewText(R.id.widget_attacks, fAttacks);
                    views.setTextViewText(R.id.widget_timer, fTimer);
                    manager.updateAppWidget(id, views);
                });
            } catch (Exception error) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    views.setTextViewText(R.id.widget_status, "Live data unavailable");
                    manager.updateAppWidget(id, views);
                });
            }
        });
    }
}

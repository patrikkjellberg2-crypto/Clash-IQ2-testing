package com.clashiq.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ClashIqWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_REFRESH = "com.clashiq.app.WIDGET_REFRESH";
    private static final String API_URL =
            "https://clash-iq2-testing.onrender.com/api/clash/dashboard?clanTag=%232Q0Q82C9R";
    private static final long REFRESH_MS = 30L * 60L * 1000L;
    private static final ExecutorService EXECUTOR = Executors.newCachedThreadPool();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateOne(context, manager, id);
        scheduleRefresh(context);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleRefresh(context);
    }

    @Override
    public void onDisabled(Context context) {
        cancelRefresh(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            refreshAll(context);
        }
    }

    private static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, ClashIqWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.clash_iq_widget);
        views.setTextViewText(R.id.widget_title, "⚔️ BHABE DHEMONS");
        views.setTextViewText(R.id.widget_status, "LOADING…");

        Intent launch = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending = PendingIntent.getActivity(
                    context, widgetId, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
        }
        manager.updateAppWidget(widgetId, views);

        EXECUTOR.execute(() -> {
            String json = fetch(API_URL);
            if (json == null) {
                String cached = context.getSharedPreferences("clash_iq_widget", Context.MODE_PRIVATE)
                        .getString("dashboard", null);
                if (cached != null) json = cached;
            } else {
                context.getSharedPreferences("clash_iq_widget", Context.MODE_PRIVATE)
                        .edit().putString("dashboard", json).apply();
            }
            final String payload = json;
            android.os.Handler main = new android.os.Handler(context.getMainLooper());
            main.post(() -> applyData(context, manager, widgetId, payload));
        });
    }

    private static void applyData(Context context, AppWidgetManager manager, int widgetId, String json) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.clash_iq_widget);
        views.setTextViewText(R.id.widget_title, "⚔️ BHABE DHEMONS");

        String status = "NO ACTIVE WAR";
        String opponent = "Waiting for next war";
        String score = "—";
        String destruction = "—";
        String attacks = "—";
        String countdown = "—";

        try {
            if (json != null) {
                JSONObject root = new JSONObject(json);
                JSONObject war = root.optJSONObject("currentWar");
                if (war != null) {
                    String state = war.optString("state", "").toLowerCase(Locale.ROOT);
                    status = state.contains("prep")
                            ? "PREPARATION DAY"
                            : (state.contains("war") || state.contains("inwar") ? "WAR DAY" : state.toUpperCase(Locale.ROOT));

                    JSONObject enemy = war.optJSONObject("opponent");
                    if (enemy != null) opponent = enemy.optString("name", "Unknown opponent");

                    JSONObject ours = war.optJSONObject("clan");
                    int ourStars = ours != null ? ours.optInt("stars", 0) : 0;
                    int enemyStars = enemy != null ? enemy.optInt("stars", 0) : 0;
                    score = ourStars + " – " + enemyStars;

                    double ourDestruction = ours != null ? ours.optDouble("destructionPercentage", 0) : 0;
                    double enemyDestruction = enemy != null ? enemy.optDouble("destructionPercentage", 0) : 0;
                    destruction = String.format(Locale.US, "%.0f%% – %.0f%%", ourDestruction, enemyDestruction);

                    if (ours != null) {
                        int attacksPerMember = ours.optInt("attacksPerMember", 1);
                        int members = ours.optInt("members", 0);
                        int attacksUsed = 0;
                        if (ours.has("members") && ours.opt("members") instanceof org.json.JSONArray) {
                            org.json.JSONArray membersArray = ours.optJSONArray("members");
                            if (membersArray != null) {
                                for (int i = 0; i < membersArray.length(); i++) {
                                    JSONObject member = membersArray.optJSONObject(i);
                                    if (member != null) attacksUsed += member.optInt("attacks", 0);
                                }
                                int total = membersArray.length() * attacksPerMember;
                                attacks = Integer.toString(Math.max(0, total - attacksUsed));
                            }
                        } else if (members > 0) {
                            attacks = "—";
                        }
                    }

                    String end = war.optString("endTime", "");
                    if (!end.isEmpty()) countdown = countdown(end);
                }
            }
        } catch (Exception ignored) {
            // Keep the widget usable even if the API shape changes.
        }

        views.setTextViewText(R.id.widget_status, status);
        views.setTextViewText(R.id.widget_opponent, "vs " + opponent);
        views.setTextViewText(R.id.widget_score, "⭐ " + score + " ⭐");
        views.setTextViewText(R.id.widget_destruction, destruction);
        views.setTextViewText(R.id.widget_attacks, "ATTACKS LEFT: " + attacks);
        views.setTextViewText(R.id.widget_countdown, countdown);

        Intent launch = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending = PendingIntent.getActivity(
                    context, widgetId, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
        }
        manager.updateAppWidget(widgetId, views);
    }

    private static String fetch(String endpoint) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(endpoint).openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) return null;
            InputStream input = connection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(input));
            StringBuilder out = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) out.append(line);
            reader.close();
            return out.toString();
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static String countdown(String endTime) {
        try {
            Instant end = Instant.parse(endTime);
            long seconds = Math.max(0, Duration.between(Instant.now(), end).getSeconds());
            long h = seconds / 3600;
            long m = (seconds % 3600) / 60;
            long s = seconds % 60;
            return String.format(Locale.US, "%02d:%02d:%02d", h, m, s);
        } catch (DateTimeParseException ignored) {
            return "—";
        }
    }

    private static void scheduleRefresh(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, ClashIqWidgetProvider.class).setAction(ACTION_REFRESH);
        PendingIntent pending = PendingIntent.getBroadcast(
                context, 9917, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarm.setInexactRepeating(
                AlarmManager.ELAPSED_REALTIME,
                SystemClock.elapsedRealtime() + REFRESH_MS,
                REFRESH_MS,
                pending);
    }

    private static void cancelRefresh(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, ClashIqWidgetProvider.class).setAction(ACTION_REFRESH);
        PendingIntent pending = PendingIntent.getBroadcast(
                context, 9917, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarm.cancel(pending);
    }
}

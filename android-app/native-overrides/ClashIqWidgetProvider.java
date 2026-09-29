package com.clashiq.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ClashIqWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_REFRESH = "com.clashiq.app.WIDGET_REFRESH";
    private static final String ACTION_NOTIFY_PREP = "com.clashiq.app.NOTIFY_PREP";
    private static final String ACTION_NOTIFY_START = "com.clashiq.app.NOTIFY_START";
    private static final String EXTRA_START_TIME = "startTime";
    private static final String EXTRA_OPPONENT = "opponent";
    private static final String API_URL =
            "https://clash-iq2-testing.onrender.com/api/clash/dashboard?clanTag=%232Q0Q82C9R";
    private static final long REFRESH_MS = 30L * 60L * 1000L;
    private static final long PREP_NOTIFICATION_MS = 15L * 60L * 1000L;
    private static final int PREP_ALARM_ID = 9918;
    private static final int START_ALARM_ID = 9919;
    private static final String CHANNEL_ID = "war_alerts";
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
        cancelWarNotifications(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_REFRESH.equals(action)) {
            refreshAll(context);
        } else if (ACTION_NOTIFY_PREP.equals(action)) {
            String opponent = intent.getStringExtra(EXTRA_OPPONENT);
            String start = intent.getStringExtra(EXTRA_START_TIME);
            showNotification(context,
                    "⚔️ WAR STARTS IN 15 MIN",
                    "BHABE DHEMONS vs " + safeOpponent(opponent),
                    "Get your attacks ready.",
                    1001);
            markNotified(context, "prep", start);
        } else if (ACTION_NOTIFY_START.equals(action)) {
            String opponent = intent.getStringExtra(EXTRA_OPPONENT);
            String start = intent.getStringExtra(EXTRA_START_TIME);
            showNotification(context,
                    "⚔️ WAR DAY",
                    "BHABE DHEMONS vs " + safeOpponent(opponent),
                    "The war has started. Clash IQ is live.",
                    1002);
            markNotified(context, "start", start);
            refreshAll(context);
        }
    }

    private static String safeOpponent(String opponent) {
        return opponent == null || opponent.trim().isEmpty() ? "Unknown opponent" : opponent;
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

        setLaunchPendingIntent(context, views, widgetId);
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
        String targetTime = "";
        String timerLabel = "—";
        boolean timerActive = false;

        try {
            if (json != null) {
                JSONObject root = new JSONObject(json);
                JSONObject war = root.optJSONObject("currentWar");
                if (war != null) {
                    String state = war.optString("state", "").toLowerCase(Locale.ROOT);
                    boolean preparation = state.contains("prep");
                    boolean inWar = state.contains("war") || state.contains("inwar");

                    status = preparation ? "PREPARATION DAY" : (inWar ? "WAR DAY" : state.toUpperCase(Locale.ROOT));

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
                        if (ours.has("members") && ours.opt("members") instanceof org.json.JSONArray) {
                            org.json.JSONArray membersArray = ours.optJSONArray("members");
                            if (membersArray != null) {
                                int attacksUsed = 0;
                                for (int i = 0; i < membersArray.length(); i++) {
                                    JSONObject member = membersArray.optJSONObject(i);
                                    if (member != null) attacksUsed += member.optInt("attacks", 0);
                                }
                                attacks = Integer.toString(Math.max(0, membersArray.length() * attacksPerMember - attacksUsed));
                            }
                        }
                    }

                    if (preparation) {
                        targetTime = war.optString("startTime", "");
                        timerLabel = "WAR STARTS IN";
                    } else if (inWar) {
                        targetTime = war.optString("endTime", "");
                        timerLabel = "WAR ENDS IN";
                    }
                    long remaining = millisUntil(targetTime);
                    if (remaining > 0) {
                        timerActive = true;
                        views.setChronometer(R.id.widget_countdown,
                                SystemClock.elapsedRealtime() + remaining,
                                "%s",
                                true);
                    }
                    scheduleWarNotifications(context, war, opponent);
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
        views.setTextViewText(R.id.widget_timer_label, timerLabel);
        if (!timerActive) {
            views.setTextViewText(R.id.widget_countdown, "—");
        }

        setLaunchPendingIntent(context, views, widgetId);
        manager.updateAppWidget(widgetId, views);
    }

    private static void setLaunchPendingIntent(Context context, RemoteViews views, int widgetId) {
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending = PendingIntent.getActivity(
                    context, widgetId, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
        }
    }

    private static long millisUntil(String isoTime) {
        try {
            if (isoTime == null || isoTime.isEmpty()) return 0;
            return Math.max(0, Duration.between(Instant.now(), Instant.parse(isoTime)).toMillis());
        } catch (DateTimeParseException ignored) {
            return 0;
        }
    }

    private static void scheduleWarNotifications(Context context, JSONObject war, String opponent) {
        String start = war.optString("startTime", "");
        long startMs = epochMillis(start);
        if (startMs <= System.currentTimeMillis()) return;

        scheduleNotification(context, ACTION_NOTIFY_START, START_ALARM_ID, startMs, start, opponent);

        long prepMs = startMs - PREP_NOTIFICATION_MS;
        if (prepMs > System.currentTimeMillis()) {
            scheduleNotification(context, ACTION_NOTIFY_PREP, PREP_ALARM_ID, prepMs, start, opponent);
        }
    }

    private static long epochMillis(String iso) {
        try {
            return Instant.parse(iso).toEpochMilli();
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static void scheduleNotification(Context context, String action, int requestCode,
                                              long when, String start, String opponent) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, ClashIqWidgetProvider.class)
                .setAction(action)
                .putExtra(EXTRA_START_TIME, start)
                .putExtra(EXTRA_OPPONENT, opponent);
        PendingIntent pending = PendingIntent.getBroadcast(
                context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pending);
        } else {
            alarm.set(AlarmManager.RTC_WAKEUP, when, pending);
        }
    }

    private static void cancelWarNotifications(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        for (int requestCode : new int[]{PREP_ALARM_ID, START_ALARM_ID}) {
            Intent intent = new Intent(context, ClashIqWidgetProvider.class);
            PendingIntent pending = PendingIntent.getBroadcast(
                    context, requestCode, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            alarm.cancel(pending);
        }
    }

    private static void showNotification(Context context, String title, String body,
                                         String text, int notificationId) {
        NotificationManager manager = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Clash IQ War Alerts",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("War preparation and start alerts for BHABE DHEMONS.");
            manager.createNotificationChannel(channel);
        }

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent pending = null;
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            pending = PendingIntent.getActivity(
                    context, notificationId, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);

        builder.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_EVENT)
                .setPriority(Notification.PRIORITY_HIGH)
                .setWhen(System.currentTimeMillis());
        if (pending != null) builder.setContentIntent(pending);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                context.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                        == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            manager.notify(notificationId, builder.build());
        }
    }

    private static void markNotified(Context context, String kind, String start) {
        if (start == null || start.isEmpty()) return;
        context.getSharedPreferences("clash_iq_widget", Context.MODE_PRIVATE)
                .edit().putBoolean(kind + "_" + start, true).apply();
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
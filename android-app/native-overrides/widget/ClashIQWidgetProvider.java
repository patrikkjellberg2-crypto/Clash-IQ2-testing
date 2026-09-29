package com.clashiq.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

public class ClashIQWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_UPDATE = "com.clashiq.app.WIDGET_UPDATE";
    private static final long INTERVAL_MS = 30_000L;

    @Override public void onEnabled(Context context) { schedule(context); }
    @Override public void onDisabled(Context context) { cancel(context); }

    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_UPDATE.equals(intent.getAction())) {
            ClashIQWidgetUpdater.updateAll(context);
            schedule(context);
        }
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        ClashIQWidgetUpdater.updateAll(context);
        schedule(context);
    }

    private static void schedule(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm == null) return;
        Intent intent = new Intent(context, ClashIQWidgetProvider.class).setAction(ACTION_UPDATE);
        PendingIntent pi = PendingIntent.getBroadcast(context, 42030, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                alarm.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + INTERVAL_MS, pi);
            } else {
                alarm.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + INTERVAL_MS, pi);
            }
        } catch (SecurityException e) {
            alarm.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + INTERVAL_MS, pi);
        }
    }

    private static void cancel(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm == null) return;
        Intent intent = new Intent(context, ClashIQWidgetProvider.class).setAction(ACTION_UPDATE);
        PendingIntent pi = PendingIntent.getBroadcast(context, 42030, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarm.cancel(pi);
    }

    public static void requestUpdate(Context context) {
        Intent intent = new Intent(context, ClashIQWidgetProvider.class).setAction(ACTION_UPDATE);
        context.sendBroadcast(intent);
    }
}

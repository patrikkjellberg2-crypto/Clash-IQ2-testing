package com.clashiq.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class ClashIQWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_UPDATE = "com.clashiq.app.WIDGET_UPDATE";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        ClashIQWidgetUpdater.updateAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_UPDATE.equals(intent != null ? intent.getAction() : null)) {
            ClashIQWidgetUpdater.updateAll(context);
        }
    }

    public static void requestUpdate(Context context) {
        Intent intent = new Intent(context, ClashIQWidgetProvider.class);
        intent.setAction(ACTION_UPDATE);
        context.sendBroadcast(intent);
    }
}

package com.clashiq.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class ClashIQWidgetUpdater {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static final String API = "https://clash-iq2-testing.onrender.com/api/clash/dashboard";

    private ClashIQWidgetUpdater() {}

    public static void updateAll(Context context) {
        Context app = context.getApplicationContext();
        EXECUTOR.execute(() -> {
            WidgetData data = fetch();
            MAIN.post(() -> render(app, data));
        });
    }

    private static WidgetData fetch() {
        HttpURLConnection c = null;
        try {
            URL url = new URL(API);
            c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(7000);
            c.setReadTimeout(9000);
            c.setRequestMethod("GET");
            c.setRequestProperty("Accept", "application/json");
            int code = c.getResponseCode();
            InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
            if (stream == null) return WidgetData.error("OFFLINE");
            BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
            if (code < 200 || code >= 300) return WidgetData.error("LIVE FEED OFFLINE");
            JSONObject root = new JSONObject(body.toString());
            JSONObject clan = root.optJSONObject("clan");
            JSONObject war = root.optJSONObject("currentWar");
            if (war == null) return WidgetData.noWar(clan != null ? clan.optString("name", "Clash IQ") : "Clash IQ");
            JSONObject own = war.optJSONObject("clan");
            JSONObject opp = war.optJSONObject("opponent");
            String state = war.optString("state", "").toUpperCase();
            String ownName = own != null ? own.optString("name", "BHABE DHEMONS") : "BHABE DHEMONS";
            String oppName = opp != null ? opp.optString("name", "Opponent") : "Opponent";
            int ownStars = own != null ? own.optInt("stars", 0) : 0;
            int oppStars = opp != null ? opp.optInt("stars", 0) : 0;
            int ownAttacks = own != null ? own.optInt("attacks", 0) : 0;
            int oppAttacks = opp != null ? opp.optInt("attacks", 0) : 0;
            String end = war.optString("endTime", "");
            JSONArray members = own != null ? own.optJSONArray("members") : null;
            int remaining = 0;
            if (members != null) {
                int attacksPer = Math.max(1, war.optInt("attacksPerMember", 2));
                remaining = Math.max(0, members.length() * attacksPer - ownAttacks);
            }
            return new WidgetData(ownName, oppName, ownStars, oppStars, ownAttacks, oppAttacks, remaining, state, end, false, "");
        } catch (Exception e) {
            return WidgetData.error("LIVE FEED OFFLINE");
        } finally { if (c != null) c.disconnect(); }
    }

    private static void render(Context context, WidgetData d) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, ClashIQWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_clash_iq);
            v.setTextViewText(R.id.widget_title, "CLASH IQ");
            v.setTextViewText(R.id.widget_status, d.status);
            v.setTextViewText(R.id.widget_own_name, trim(d.ownName));
            v.setTextViewText(R.id.widget_opp_name, trim(d.oppName));
            v.setTextViewText(R.id.widget_score, d.ownStars + "  —  " + d.oppStars);
            v.setTextViewText(R.id.widget_attacks, "⚔ " + d.ownAttacks + " used   •   " + d.remaining + " left");
            v.setTextViewText(R.id.widget_timer, formatEnd(d.endTime));
            v.setTextViewText(R.id.widget_error, d.error);
            Intent open = new Intent(context, MainActivity.class).putExtra("clashiq_path", "/war-center");
            PendingIntent pi = PendingIntent.getActivity(context, id, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.widget_root, pi);
            manager.updateAppWidget(id, v);
        }
    }

    private static String trim(String s) { return s == null ? "—" : (s.length() > 17 ? s.substring(0, 16) + "…" : s); }
    private static String formatEnd(String iso) {
        if (iso == null || iso.isEmpty()) return "LIVE WAR";
        try {
            java.time.Instant end = java.time.Instant.parse(iso);
            long seconds = Math.max(0, java.time.Duration.between(java.time.Instant.now(), end).getSeconds());
            long h = seconds / 3600, m = (seconds % 3600) / 60;
            return h > 0 ? String.format("%dh %02dm", h, m) : String.format("%dm", m);
        } catch (Exception e) { return "LIVE WAR"; }
    }

    private static final class WidgetData {
        String ownName, oppName, status, endTime, error; int ownStars, oppStars, ownAttacks, oppAttacks, remaining;
        WidgetData(String a,String b,int c,int d,int e,int f,int g,String h,String i,boolean j,String k){ownName=a;oppName=b;ownStars=c;oppStars=d;ownAttacks=e;oppAttacks=f;remaining=g;status=h;endTime=i;error=k;}
        static WidgetData error(String e){return new WidgetData("Clash IQ","—",0,0,0,0,0,"OFFLINE","",true,e);}
        static WidgetData noWar(String n){return new WidgetData(n,"—",0,0,0,0,0,"NO ACTIVE WAR","",false,"");}
    }
}

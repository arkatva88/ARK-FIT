"use client";

/**
 * Converts a base64 string to a Uint8Array required by applicationServerKey
 */
export function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detects whether Push API and Service Workers are supported by the current browser environment
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Gets a human-readable device label from userAgent
 */
export function getDeviceLabel(): string {
  if (typeof window === "undefined") return "Web Client";
  const ua = navigator.userAgent;
  let os = "Desktop";
  if (/android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac/i.test(ua)) os = "macOS";
  else if (/Win/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return `${os} ${browser}`;
}

/**
 * Registers the Service Worker and returns the active registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("Service worker registration error:", err);
    throw err;
  }
}

/**
 * Returns current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Checks if the current browser already has an active push subscription
 */
export async function isDevicePushSubscribed(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/**
 * Requests notification permission from user and subscribes to PushManager
 */
export async function subscribeUserToPush(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  // 1. User gesture permission request
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      success: false,
      error:
        permission === "denied"
          ? "Notification permission was blocked in browser settings."
          : "Notification permission was dismissed.",
    };
  }

  // 2. Register Service Worker
  const reg = await registerServiceWorker();
  if (!reg) {
    return { success: false, error: "Unable to register service worker." };
  }

  // 3. Fetch VAPID Public Key
  let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    try {
      const res = await fetch("/api/notifications/vapid-public-key");
      const data = await res.json();
      vapidPublicKey = data.publicKey;
    } catch {
      // Fallback
    }
  }

  if (!vapidPublicKey) {
    return { success: false, error: "Public VAPID key is missing on the server." };
  }

  const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);

  // 4. Check for existing subscription or subscribe
  let sub = await reg.pushManager.getSubscription();

  if (sub) {
    // Check if existing subscription server key matches
    const rawExistingKey = sub.options?.applicationServerKey;
    let keysMatch = false;
    if (rawExistingKey) {
      const existingKeyArray = new Uint8Array(rawExistingKey);
      keysMatch =
        existingKeyArray.length === applicationServerKey.length &&
        existingKeyArray.every((val, i) => val === applicationServerKey[i]);
    }

    if (!keysMatch) {
      // Unsubscribe stale subscription with mismatched key
      await sub.unsubscribe().catch(() => {});
      sub = null;
    }
  }

  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    } catch (err: any) {
      // If subscribe threw InvalidStateError, force-unsubscribe any orphaned subscription and retry once
      try {
        const orphaned = await reg.pushManager.getSubscription();
        if (orphaned) await orphaned.unsubscribe().catch(() => {});
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });
      } catch (retryErr: any) {
        return {
          success: false,
          error: "Failed to create push subscription: " + (retryErr.message || err.message),
        };
      }
    }
  }

  if (!sub) {
    return { success: false, error: "PushManager failed to provide a valid subscription." };
  }

  // 5. Send subscription to server
  try {
    const subJson = sub.toJSON();
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subJson,
        deviceLabel: getDeviceLabel(),
      }),
    });

    const responseData = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: responseData.error || "Failed to save push subscription on server.",
      };
    }

    return { success: true, subscription: sub };
  } catch (err: any) {
    return { success: false, error: "Network error saving subscription: " + err.message };
  }
}

/**
 * Unsubscribes current device from push notifications
 */
export async function unsubscribeUserFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) return { success: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

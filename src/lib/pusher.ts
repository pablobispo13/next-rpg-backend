import Pusher from "pusher";

let _pusher: Pusher | null = null;

export function getPusher(): Pusher | null {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appId || !key || !secret || !cluster) {
        if (process.env.NODE_ENV === "development" && appId) {
            // Partially configured — warn once
            console.warn("[Pusher] Configuração incompleta. Verifique PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET e NEXT_PUBLIC_PUSHER_CLUSTER no .env");
        }
        return null;
    }

    if (!_pusher) {
        _pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
    }
    return _pusher;
}

export async function notifyStreamUpdate(): Promise<void> {
    const pusher = getPusher();
    if (!pusher) return;
    try {
        await pusher.trigger("stream", "updated", {});
    } catch (err) {
        if (process.env.NODE_ENV === "development") {
            console.error("[Pusher] Falha ao notificar stream:", err);
        }
    }
}

export async function notifyCombatUpdate(combatId: string): Promise<void> {
    const pusher = getPusher();
    if (!pusher) return;
    try {
        await pusher.trigger(`combat-${combatId}`, "updated", {});
    } catch (err) {
        if (process.env.NODE_ENV === "development") {
            console.error("[Pusher] Falha ao notificar combate:", err);
        }
    }
}


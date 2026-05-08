import PusherJS from "pusher-js";

let _client: PusherJS | null = null;

export function getPusherClient(): PusherJS | null {
    if (typeof window === "undefined") return null;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) return null;

    if (!_client) {
        if (process.env.NODE_ENV === "development") {
            PusherJS.logToConsole = true; // mostra eventos no console em dev
        }

        _client = new PusherJS(key, { cluster });

        _client.connection.bind("connected", () => {
            if (process.env.NODE_ENV === "development") {
                console.log("[Pusher] Conectado. Socket ID:", _client?.connection.socket_id);
            }
        });

        _client.connection.bind("error", (err: unknown) => {
            console.error("[Pusher] Erro de conexão:", err);
        });
    }
    return _client;
}

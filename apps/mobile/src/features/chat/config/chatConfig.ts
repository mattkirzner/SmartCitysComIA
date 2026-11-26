function chatUrl(): string {
    const configured = process.env.EXPO_PUBLIC_CHAT_URL?.trim();
    return (configured || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export const chatConfig = {
    baseUrl: chatUrl(),
};

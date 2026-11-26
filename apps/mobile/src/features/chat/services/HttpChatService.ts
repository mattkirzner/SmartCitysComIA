import { chatConfig } from '@/src/features/chat/config/chatConfig';
import type {
    ChatRequest,
    ChatResponse,
    ChatService,
} from '@/src/features/chat/models/Chat';
import type { AccessTokenProvider } from
    '@/src/features/auth/services/AccessTokenProvider';

export class HttpChatService implements ChatService {
    constructor(
        private readonly tokens: AccessTokenProvider,
        private readonly baseUrl: string = chatConfig.baseUrl,
    ) {}

    async send(request: ChatRequest): Promise<ChatResponse> {
        const accessToken = await this.tokens.getValidAccessToken();
        const response = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(request),
        });

        if (response.status === 401) {
            throw new Error('Sua sessão expirou. Faça login novamente.');
        }
        if (!response.ok) {
            throw new Error('O assistente está temporariamente indisponível.');
        }
        return response.json() as Promise<ChatResponse>;
    }
}

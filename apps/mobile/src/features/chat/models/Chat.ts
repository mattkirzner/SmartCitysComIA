import type { OccurrenceFormDraft } from
    '@/src/features/occurrences/models/OccurrenceFormDraft';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
    role: ChatRole;
    content: string;
};

export type ChatDraft = {
    titulo?: string | null;
    categoria?: string | null;
    regiao?: string | null;
    descricao?: string | null;
    endereco?: string | null;
    prioridade?: string | null;
};

export type ChatAction =
    | { type: 'navigate_to_form'; payload: ChatDraft | null }
    | { type: 'none'; payload?: ChatDraft | null };

export type ChatResponse = {
    message: string;
    intent: 'faq' | 'report' | 'query_report' | 'unknown';
    draft: ChatDraft | null;
    action: ChatAction;
};

export type ChatRequest = {
    userId: string;
    conversationId: string;
    messages: ChatMessage[];
};

export type ChatService = {
    send(request: ChatRequest): Promise<ChatResponse>;
};

export type { OccurrenceFormDraft };

import { useCallback, useRef, useState } from 'react';

import { useAuthSession } from '@/src/features/auth/hooks/useAuthSession';
import type { ChatMessage, ChatService } from '@/src/features/chat/models/Chat';
import { HttpChatService } from '@/src/features/chat/services/HttpChatService';
import { authSessionService } from '@/src/composition/appDependencies';
import type { OccurrenceFormDraft } from
    '@/src/features/occurrences/models/OccurrenceFormDraft';
import {
    occurrenceCategories,
    occurrencePriorities,
    occurrenceRegions,
} from '@/src/features/occurrences/models/occurrenceOptions';

type ChatDependencies = {
    chat: ChatService;
};

const defaultDependencies: ChatDependencies = {
    chat: new HttpChatService(authSessionService),
};

function allowed<T extends string>(
    value: string | null | undefined,
    options: { value: T }[],
): T | undefined {
    return options.find((option) => option.value === value)?.value;
}

export function useChatViewModel(
    dependencies: ChatDependencies = defaultDependencies,
) {
    const { session } = useAuthSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formDraft, setFormDraft] = useState<OccurrenceFormDraft | null>(null);
    const conversationId = useRef(`conv-${Date.now()}`).current;

    const clearFormDraft = useCallback(() => setFormDraft(null), []);

    const send = useCallback(async () => {
        const content = text.trim();
        if (!content || isSending) return;
        if (session.status !== 'authenticated') {
            setError('Faça login para conversar com o assistente.');
            return;
        }

        const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
        setMessages(nextMessages);
        setText('');
        setIsSending(true);
        setError(null);
        try {
            const response = await dependencies.chat.send({
                userId: session.user.id,
                conversationId,
                messages: nextMessages,
            });
            setMessages([...nextMessages, { role: 'assistant', content: response.message }]);
            if (response.action.type === 'navigate_to_form' && response.action.payload) {
                const payload = response.action.payload;
                setFormDraft({
                    title: payload.titulo?.trim() || undefined,
                    description: payload.descricao?.trim() || undefined,
                    address: payload.endereco?.trim() || undefined,
                    category: allowed(payload.categoria, occurrenceCategories),
                    region: allowed(payload.regiao, occurrenceRegions),
                    priority: allowed(payload.prioridade, occurrencePriorities),
                });
            }
        } catch (caught) {
            setError(caught instanceof Error
                ? caught.message
                : 'Não foi possível falar com o assistente.');
        } finally {
            setIsSending(false);
        }
    }, [conversationId, dependencies.chat, isSending, messages, session, text]);

    return {
        messages,
        text,
        setText,
        isSending,
        error,
        send,
        formDraft,
        clearFormDraft,
    };
}

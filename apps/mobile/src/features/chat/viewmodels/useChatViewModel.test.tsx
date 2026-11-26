import { act, renderHook } from '@testing-library/react-native';

import type { ChatService } from '@/src/features/chat/models/Chat';
import { useChatViewModel } from './useChatViewModel';

jest.mock('@/src/features/auth/hooks/useAuthSession', () => ({
    useAuthSession: () => ({
        session: { status: 'authenticated', user: { id: 'cidadao-1' } },
    }),
}));

describe('useChatViewModel', () => {
    it('pede o formulário só quando o assistente devolve o rascunho', async () => {
        const chat: ChatService = {
            send: jest.fn().mockResolvedValue({
                message: 'Vou abrir o formulário para você revisar.',
                intent: 'report',
                draft: null,
                action: {
                    type: 'navigate_to_form',
                    payload: {
                        titulo: 'Buraco',
                        descricao: 'Buraco na via',
                        categoria: 'MANUTENCAO_DE_VIAS',
                        regiao: 'AGRESTE',
                        endereco: 'Rua das Flores',
                        prioridade: 'ALTA',
                    },
                },
            }),
        };
        const { result } = renderHook(() => useChatViewModel({ chat }));

        act(() => result.current.setText('Tem um buraco'));
        await act(async () => {
            await result.current.send();
        });

        expect(chat.send).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'cidadao-1',
            messages: [{ role: 'user', content: 'Tem um buraco' }],
        }));
        expect(result.current.messages[1]?.content)
            .toBe('Vou abrir o formulário para você revisar.');
        expect(result.current.formDraft).toEqual({
            title: 'Buraco',
            description: 'Buraco na via',
            address: 'Rua das Flores',
            category: 'MANUTENCAO_DE_VIAS',
            region: 'AGRESTE',
            priority: 'ALTA',
        });
    });
});

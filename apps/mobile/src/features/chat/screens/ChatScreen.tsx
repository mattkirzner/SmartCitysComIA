import { useEffect } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatViewModel } from '@/src/features/chat/viewmodels/useChatViewModel';
import { occurrenceFormDraftToParams } from
    '@/src/features/occurrences/models/OccurrenceFormDraft';

export function ChatScreen() {
    const vm = useChatViewModel();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    useEffect(() => {
        if (!vm.formDraft) return;
        const params = occurrenceFormDraftToParams(vm.formDraft);
        vm.clearFormDraft();
        router.push({ pathname: '/create-occurrence', params });
    }, [vm.formDraft, vm.clearFormDraft]);

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Assistente</ThemedText>
            <ScrollView contentContainerStyle={styles.messages}>
                {vm.messages.length === 0 && (
                    <ThemedText>
                        Posso explicar o app, consultar suas ocorrências ou preparar um relato para você revisar.
                    </ThemedText>
                )}
                {vm.messages.map((message, index) => (
                    <View
                        key={`${message.role}-${index}`}
                        style={[
                            styles.bubble,
                            message.role === 'user' ? styles.user : styles.assistant,
                        ]}
                    >
                        <ThemedText lightColor={message.role === 'user' ? '#fff' : undefined}
                            darkColor={message.role === 'user' ? '#fff' : undefined}>
                            {message.content}
                        </ThemedText>
                    </View>
                ))}
                {vm.isSending && <ActivityIndicator />}
                {vm.error && <ThemedText style={styles.error}>{vm.error}</ThemedText>}
            </ScrollView>
            <View style={styles.composer}>
                <TextInput
                    value={vm.text}
                    onChangeText={vm.setText}
                    placeholder="Escreva sua mensagem"
                    placeholderTextColor={colors.icon}
                    style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                    accessibilityLabel="Mensagem para o assistente"
                />
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Enviar mensagem"
                    disabled={vm.isSending}
                    style={[styles.send, vm.isSending && styles.disabled]}
                    onPress={() => { void vm.send(); }}
                >
                    <ThemedText lightColor="#fff" darkColor="#fff">Enviar</ThemedText>
                </Pressable>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    messages: { gap: 10, paddingBottom: 12 },
    bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
    user: { alignSelf: 'flex-end', backgroundColor: '#0a7ea4' },
    assistant: { alignSelf: 'flex-start', backgroundColor: '#e8eef1' },
    composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
    send: { backgroundColor: '#0a7ea4', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
    disabled: { opacity: 0.6 },
    error: { color: '#b3261e' },
});

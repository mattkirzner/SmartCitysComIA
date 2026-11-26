import type {
    OccurrenceCategory,
    OccurrencePriority,
    OccurrenceRegion,
} from '@/src/features/occurrences/models/Occurrence';
import {
    occurrenceCategories,
    occurrencePriorities,
    occurrenceRegions,
} from '@/src/features/occurrences/models/occurrenceOptions';

export type OccurrenceFormDraft = {
    title?: string;
    description?: string;
    address?: string;
    category?: OccurrenceCategory;
    region?: OccurrenceRegion;
    priority?: OccurrencePriority;
};

type ParamValue = string | string[] | undefined;

function first(value: ParamValue): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
}

function oneOf<T extends string>(
    value: string | undefined,
    options: { value: T }[],
): T | undefined {
    return options.find((option) => option.value === value)?.value;
}

export function occurrenceFormDraftFromParams(
    params: Record<string, ParamValue>,
): OccurrenceFormDraft | undefined {
    const draft: OccurrenceFormDraft = {
        title: first(params.titulo),
        description: first(params.descricao),
        address: first(params.endereco),
        category: oneOf(first(params.categoria), occurrenceCategories),
        region: oneOf(first(params.regiao), occurrenceRegions),
        priority: oneOf(first(params.prioridade), occurrencePriorities),
    };
    if (!draft.title && !draft.description && !draft.address
        && !draft.category && !draft.region && !draft.priority) {
        return undefined;
    }
    return draft;
}

export function occurrenceFormDraftToParams(
    draft: OccurrenceFormDraft,
): Record<string, string> {
    return {
        ...(draft.title ? { titulo: draft.title } : {}),
        ...(draft.description ? { descricao: draft.description } : {}),
        ...(draft.address ? { endereco: draft.address } : {}),
        ...(draft.category ? { categoria: draft.category } : {}),
        ...(draft.region ? { regiao: draft.region } : {}),
        ...(draft.priority ? { prioridade: draft.priority } : {}),
    };
}

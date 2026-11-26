import { useCallback, useEffect, useState } from 'react';

import { occurrenceService } from '@/src/composition/appDependencies';
import { getCurrentCoordinates } from '@/src/features/location/services/locationService';
import type {
    OccurrenceCategory,
    OccurrencePriority,
    OccurrenceRegion,
    SaveOccurrenceInput,
} from '@/src/features/occurrences/models/Occurrence';
import type { OccurrenceService } from
    '@/src/features/occurrences/services/OccurrenceService';
import type { OccurrenceFormDraft } from
    '@/src/features/occurrences/models/OccurrenceFormDraft';

type Coordinates = { latitude: number; longitude: number };

type OccurrenceFormDependencies = {
    service: OccurrenceService;
    getCoordinates: () => Promise<Coordinates>;
};

const defaultDependencies: OccurrenceFormDependencies = {
    service: occurrenceService,
    getCoordinates: getCurrentCoordinates,
};

export function useOccurrenceFormViewModel(
    id?: number,
    dependencies?: OccurrenceFormDependencies,
    draft?: OccurrenceFormDraft,
) {
    const resolved = dependencies ?? defaultDependencies;
    const [title, setTitle] = useState(draft?.title ?? '');
    const [description, setDescription] = useState(draft?.description ?? '');
    const [address, setAddress] = useState(draft?.address ?? '');
    const [category, setCategory] =
        useState<OccurrenceCategory>(draft?.category ?? 'ILUMINACAO_PUBLICA');
    const [region, setRegion] =
        useState<OccurrenceRegion>(draft?.region ?? 'REGIAO_METROPOLITANA_DO_RECIFE');
    const [priority, setPriority] =
        useState<OccurrencePriority>(draft?.priority ?? 'MEDIA');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(id));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let active = true;
        resolved.service.getById(id)
            .then((occurrence) => {
                if (!active) return;
                setTitle(occurrence.title);
                setDescription(occurrence.description);
                setAddress(occurrence.address);
                setCategory(occurrence.category);
                setRegion(occurrence.region);
                setPriority(occurrence.priority);
                setLatitude(occurrence.latitude);
                setLongitude(occurrence.longitude);
                setPhoto(occurrence.images[0]?.path ?? null);
            })
            .catch((caught) => {
                if (active) {
                    setError(caught instanceof Error
                        ? caught.message
                        : 'Não foi possível carregar a ocorrência.');
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => { active = false; };
    }, [resolved.service, id]);

    const useCurrentLocation = useCallback(async () => {
        setError(null);
        try {
            const coordinates = await resolved.getCoordinates();
            setLatitude(coordinates.latitude);
            setLongitude(coordinates.longitude);
        } catch (caught) {
            setError(caught instanceof Error
                ? caught.message
                : 'Não foi possível obter sua localização.');
        }
    }, [resolved]);

    const save = useCallback(async () => {
        const trimmedAddress = address.trim();
        const hasCoordinates = latitude !== null && longitude !== null;

        if (!title.trim() || !description.trim()) {
            setError('Preencha título e descrição.');
            return false;
        }

        if (!trimmedAddress && !hasCoordinates) {
            setError('Informe um endereço ou use a localização atual.');
            return false;
        }

        const input: SaveOccurrenceInput = {
            title: title.trim(),
            description: description.trim(),
            address: address.trim() || null,
            category,
            region,
            priority,
            latitude: hasCoordinates ? latitude : null,
            longitude: hasCoordinates ? longitude : null,
            images: photo ? [photo] : [],
        };

        setIsSaving(true);
        setError(null);
        try {
            if (id) {
                await resolved.service.update(id, input);
            } else {
                await resolved.service.create(input);
            }
            return true;
        } catch (caught) {
            setError(caught instanceof Error
                ? caught.message
                : 'Não foi possível salvar a ocorrência.');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [
        address, category, resolved.service, description, id, latitude, longitude,
        photo, priority, region, title,
    ]);

    return {
        title, setTitle,
        description, setDescription,
        address, setAddress,
        category, setCategory,
        region, setRegion,
        priority, setPriority,
        latitude, longitude,
        photo, setPhoto,
        isLoading, isSaving, error,
        useCurrentLocation,
        save,
    };
}

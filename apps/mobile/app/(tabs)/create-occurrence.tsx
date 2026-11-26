import { useLocalSearchParams } from 'expo-router';

import { OccurrenceFormScreen } from
    '@/src/features/occurrences/screens/OccurrenceFormScreen';
import { occurrenceFormDraftFromParams } from
    '@/src/features/occurrences/models/OccurrenceFormDraft';

export default function CreateOccurrenceRoute() {
    const params = useLocalSearchParams();
    return (
        <OccurrenceFormScreen
            draft={occurrenceFormDraftFromParams(params)}
        />
    );
}

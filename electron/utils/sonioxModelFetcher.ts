import axios from 'axios';

export const SONIOX_API_BASE_URL = 'https://api.soniox.com';
export const SONIOX_MODELS_ENDPOINT = `${SONIOX_API_BASE_URL}/v1/models`;
export const SONIOX_DEFAULT_REALTIME_MODEL = 'stt-rt-v4';

export interface SonioxApiModel {
    id: string;
    name?: string;
    aliased_model_id?: string | null;
    transcription_mode?: string;
    languages?: Array<{ code: string; name: string }>;
    supports_max_endpoint_delay?: boolean;
}

export interface SonioxRealtimeModelOption {
    id: string;
    label: string;
    aliasedModelId?: string;
    languageCount: number;
    supportsMaxEndpointDelay: boolean;
}

function extractRealtimeVersion(modelId?: string): number {
    const match = modelId?.match(/^stt-rt-v(\d+)$/i);
    return match ? Number(match[1]) : 0;
}

function buildLabel(model: SonioxApiModel): string {
    const friendlyName = model.name?.trim() || model.id;
    const languageCount = model.languages?.length ?? 0;
    const aliasSuffix = model.aliased_model_id ? ` Alias for ${model.aliased_model_id}.` : '';
    const endpointSuffix = model.supports_max_endpoint_delay ? ' Supports endpoint delay tuning.' : '';
    return `${friendlyName} (${model.id})${languageCount > 0 ? ` • ${languageCount}+ languages` : ''}.${aliasSuffix}${endpointSuffix}`.trim();
}

export function normalizeSonioxRealtimeModels(models: SonioxApiModel[]): SonioxRealtimeModelOption[] {
    const seen = new Set<string>();

    return models
        .filter((model) => {
            if (!model?.id || seen.has(model.id)) return false;
            seen.add(model.id);
            return model.transcription_mode === 'real_time' || model.id.startsWith('stt-rt');
        })
        .sort((left, right) => {
            const leftIsAlias = Boolean(left.aliased_model_id);
            const rightIsAlias = Boolean(right.aliased_model_id);

            if (leftIsAlias !== rightIsAlias) {
                return leftIsAlias ? 1 : -1;
            }

            const leftVersion = extractRealtimeVersion(left.id);
            const rightVersion = extractRealtimeVersion(right.id);
            if (leftVersion !== rightVersion) {
                return rightVersion - leftVersion;
            }

            const leftAliasTarget = extractRealtimeVersion(left.aliased_model_id ?? undefined);
            const rightAliasTarget = extractRealtimeVersion(right.aliased_model_id ?? undefined);
            if (leftAliasTarget !== rightAliasTarget) {
                return rightAliasTarget - leftAliasTarget;
            }

            return left.id.localeCompare(right.id);
        })
        .map((model) => ({
            id: model.id,
            label: buildLabel(model),
            aliasedModelId: model.aliased_model_id || undefined,
            languageCount: model.languages?.length ?? 0,
            supportsMaxEndpointDelay: Boolean(model.supports_max_endpoint_delay),
        }));
}

export function resolvePreferredSonioxRealtimeModel(
    models: SonioxRealtimeModelOption[],
    preferredModelId?: string
): string {
    if (preferredModelId && models.some((model) => model.id === preferredModelId)) {
        return preferredModelId;
    }

    if (models.some((model) => model.id === SONIOX_DEFAULT_REALTIME_MODEL)) {
        return SONIOX_DEFAULT_REALTIME_MODEL;
    }

    return models[0]?.id || SONIOX_DEFAULT_REALTIME_MODEL;
}

export async function fetchSonioxRealtimeModels(apiKey: string): Promise<SonioxRealtimeModelOption[]> {
    const response = await axios.get(SONIOX_MODELS_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        timeout: 15000,
    });

    const models = Array.isArray(response.data?.models) ? response.data.models : [];
    return normalizeSonioxRealtimeModels(models);
}

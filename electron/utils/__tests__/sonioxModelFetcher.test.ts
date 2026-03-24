const test = require('node:test');
const assert = require('node:assert/strict');
const {
    SONIOX_DEFAULT_REALTIME_MODEL,
    normalizeSonioxRealtimeModels,
    resolvePreferredSonioxRealtimeModel,
} = require('../sonioxModelFetcher.ts');

test('normalizeSonioxRealtimeModels keeps canonical real-time models first and retains aliases', () => {
    const normalized = normalizeSonioxRealtimeModels([
        {
            id: 'stt-async-v4',
            transcription_mode: 'async',
            name: 'Speech-to-Text Async v4',
        },
        {
            id: 'stt-rt-v3-preview',
            aliased_model_id: 'stt-rt-v3',
            transcription_mode: 'real_time',
            name: 'Speech-to-Text Real-time Preview',
            languages: [{ code: 'en', name: 'English' }],
        },
        {
            id: 'stt-rt-v3',
            transcription_mode: 'real_time',
            name: 'Speech-to-Text Real-time v3',
            languages: [{ code: 'en', name: 'English' }],
        },
        {
            id: 'stt-rt-v4',
            transcription_mode: 'real_time',
            name: 'Speech-to-Text Real-time v4',
            supports_max_endpoint_delay: true,
            languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }],
        },
        {
            id: 'stt-rt-preview-v2',
            aliased_model_id: 'stt-rt-v3',
            transcription_mode: 'real_time',
            name: 'Speech-to-Text Real-time Preview v2',
            languages: [{ code: 'en', name: 'English' }],
        },
    ]);

    assert.deepEqual(
        normalized.map((model: { id: string }) => model.id),
        ['stt-rt-v4', 'stt-rt-v3', 'stt-rt-preview-v2', 'stt-rt-v3-preview']
    );
    assert.equal(normalized[0].supportsMaxEndpointDelay, true);
    assert.match(normalized[2].label, /Alias for stt-rt-v3/);
    assert.ok(normalized.every((model: { id: string }) => model.id.startsWith('stt-rt')));
});

test('resolvePreferredSonioxRealtimeModel falls back to the current default or first available model', () => {
    const models = normalizeSonioxRealtimeModels([
        {
            id: 'stt-rt-v4',
            transcription_mode: 'real_time',
            languages: [{ code: 'en', name: 'English' }],
        },
        {
            id: 'stt-rt-v3',
            transcription_mode: 'real_time',
            languages: [{ code: 'en', name: 'English' }],
        },
    ]);

    assert.equal(resolvePreferredSonioxRealtimeModel(models, 'stt-rt-v3'), 'stt-rt-v3');
    assert.equal(resolvePreferredSonioxRealtimeModel(models, 'missing-model'), SONIOX_DEFAULT_REALTIME_MODEL);
    assert.equal(resolvePreferredSonioxRealtimeModel([], 'missing-model'), SONIOX_DEFAULT_REALTIME_MODEL);
});

export interface PromptPreset {
	id: string;
	name: string;
	prompt: string;
	isBuiltIn?: boolean;
}

export interface GPTEditorSettings {
	apiKey: string;
	model: string;
	apiUrl: string;
	provider: 'openai' | 'gemini' | 'claude';
	geminiApiKey: string;
	geminiModel: string;
	claudeApiKey: string;
	claudeModel: string;
	documentLength: 'short' | 'medium' | 'long' | 'very-long';
	prompt: string;
	promptPresets: PromptPreset[];
	activePresetId: string;
}

export const BUILT_IN_PRESETS: PromptPreset[] = [
	{
		id: 'encyclopedia',
		name: '백과사전',
		isBuiltIn: true,
		prompt: `백과사전 느낌으로, 한국어 문서 생성. 용어는 영어로 사용해도 괜찮다.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가. 수식은 옵시디안 형식으로 in line 의 경우 $ $ 표시로 감싸기`,
	},
	{
		id: 'tutorial',
		name: '튜토리얼',
		isBuiltIn: true,
		prompt: `단계별 튜토리얼 형식으로 한국어 문서 생성. 초보자도 따라할 수 있도록 상세하게 설명.

코드 예제가 필요한 경우 마크다운 코드 블록으로 포함. 각 단계마다 번호를 매기고 설명과 예제를 함께 제공.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가.`,
	},
	{
		id: 'summary',
		name: '요약 노트',
		isBuiltIn: true,
		prompt: `핵심 내용을 간결하게 요약한 노트 형식으로 한국어 문서 생성. 불릿 포인트를 활용하여 읽기 쉽게 정리.

중요한 개념은 **굵게** 표시. 필요한 경우 표(table)를 사용하여 비교/정리.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가.`,
	},
	{
		id: 'comparison',
		name: '비교 분석',
		isBuiltIn: true,
		prompt: `주제에 대한 비교 분석 문서를 한국어로 생성. 장단점, 차이점을 표와 함께 명확하게 정리.

가능하면 마크다운 표를 사용하고, 각 항목별로 구체적인 설명 포함.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가.`,
	},
];

export const DEFAULT_SETTINGS: GPTEditorSettings = {
	apiKey: '',
	model: 'gpt-4-turbo',
	apiUrl: 'https://api.openai.com/v1',
	provider: 'openai',
	geminiApiKey: '',
	geminiModel: 'gemini-3-pro-preview',
	claudeApiKey: '',
	claudeModel: 'claude-sonnet-4-6',
	documentLength: 'medium',
	prompt: BUILT_IN_PRESETS[0].prompt,
	promptPresets: [],
	activePresetId: 'encyclopedia',
};

export function getAllPresets(settings: GPTEditorSettings): PromptPreset[] {
	return [...BUILT_IN_PRESETS, ...settings.promptPresets];
}

export function getActivePreset(settings: GPTEditorSettings): PromptPreset | undefined {
	return getAllPresets(settings).find((p) => p.id === settings.activePresetId);
}

export function generatePresetId(): string {
	return 'custom-' + Date.now().toString(36);
}

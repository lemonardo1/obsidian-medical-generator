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
		prompt: `Computer Science 또는 Medical 분야의 전문 백과사전 스타일로 한국어 문서 생성. 대상 독자는 해당 분야의 배경지식이 있는 전문가/대학원생 수준. 기초적인 설명은 생략하고, 핵심 개념과 심화 내용 중심으로 작성. 용어는 영어로 사용해도 괜찮다.

같은 제목이라도 CS와 Medical 등 여러 분야에 걸칠 수 있으므로, CS 또는 Medical 관점에서 서술하되 타 분야의 동명 개념이 있으면 간단히 구분해줘.

수식은 옵시디안 형식으로 in line 의 경우 $ $ 표시로 감싸기.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가.`,
	},
	{
		id: 'tutorial',
		name: '튜토리얼',
		isBuiltIn: true,
		prompt: `CS 또는 Medical 분야의 실무/연구 수준 튜토리얼로 한국어 문서 생성. 독자는 기본기가 있는 전문가이므로 기초 개념 설명은 최소화하고, 실제 적용과 구현에 초점.

코드 예제(CS) 또는 프로토콜/절차(Medical)가 필요한 경우 마크다운 코드 블록이나 표로 포함. 각 단계마다 번호를 매기고 설명과 예제를 함께 제공.

문서 마지막에는

---

관련 문서: [[다른 문서명]], [[다른 문서명2]]

이런식으로 형식 맞춰줘. 관련 문서명은 새롭게 추천해서 추가.`,
	},
	{
		id: 'summary',
		name: '요약 노트',
		isBuiltIn: true,
		prompt: `CS 또는 Medical 분야 전문가를 위한 핵심 요약 노트 형식으로 한국어 문서 생성. 불릿 포인트를 활용하여 읽기 쉽게 정리. 기초 정의보다는 핵심 메커니즘, 최신 동향, 임상/실무 적용점 위주.

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
		prompt: `CS 또는 Medical 분야 관점에서 주제에 대한 비교 분석 문서를 한국어로 생성. 전문가 독자 대상으로, 장단점·trade-off·임상 근거 또는 벤치마크 데이터를 표와 함께 명확하게 정리.

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

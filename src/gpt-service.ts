import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";
import { GPTEditorSettings } from './settings';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export interface GPTResponse {
	content: string;
	error?: string;
}

const LENGTH_INSTRUCTIONS: Record<GPTEditorSettings['documentLength'], string> = {
	'short': '문서 길이는 짧게, 핵심 내용 위주로 500자 내외로 작성해줘.',
	'medium': '문서 길이는 중간 정도로, 주요 내용을 충분히 다루되 1500자 내외로 작성해줘.',
	'long': '문서 길이는 길게, 세부 내용까지 상세하게 3000자 내외로 작성해줘.',
	'very-long': '문서 길이는 매우 길게, 가능한 모든 내용을 포괄적으로 5000자 이상으로 작성해줘.',
};

function resolveBaseUrl(apiUrl: string | undefined): string {
	const fallback = DEFAULT_BASE_URL;
	if (!apiUrl) {
		return fallback;
	}

	let sanitized = apiUrl.trim();
	if (!sanitized) {
		return fallback;
	}

	sanitized = sanitized.replace(/\/chat\/completions\/?$/i, '');
	sanitized = sanitized.replace(/\/+$/, '');
	if (!sanitized) {
		return fallback;
	}

	try {
		const url = new URL(sanitized);
		const path = url.pathname.replace(/\/+$/, '');
		if (
			/api\.openai\.com$/i.test(url.hostname) &&
			!/\/v\d+$/i.test(path)
		) {
			url.pathname = `${path || ''}/v1`;
			return url.toString();
		}

		url.pathname = path;
		return url.toString();
	} catch (error) {
		console.error('Invalid API URL provided, falling back to default.', error);
		return fallback;
	}
}

function buildPrompts(title: string, settings: GPTEditorSettings): { system: string; user: string } {
	const lengthInstruction = LENGTH_INSTRUCTIONS[settings.documentLength];
	const system = 'You are an expert-level technical writer specializing in Computer Science and Medical/Biomedical fields. Your audience has strong domain knowledge — avoid basic explanations and write at a professional, graduate-level depth. Use precise terminology. When a topic exists across multiple disciplines (e.g. "Transformer" in CS vs. electrical engineering, "Protocol" in networking vs. clinical medicine), focus on the CS or Medical interpretation unless the user prompt specifies otherwise. Write in Korean, but keep technical terms in English where standard. Return only the markdown content without any explanations or additional text.';
	const user = `${title}에 맞는 마크다운 문서 생성.\n\n${settings.prompt}\n\n${lengthInstruction}`;
	return { system, user };
}

export async function callGPTAPI(
	title: string,
	settings: GPTEditorSettings
): Promise<GPTResponse> {
	if (settings.provider === 'claude') {
		if (!settings.claudeApiKey) {
			return {
				content: '',
				error: 'Claude API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
			};
		}

		try {
			const client = new Anthropic({
				apiKey: settings.claudeApiKey,
				dangerouslyAllowBrowser: true,
			});

			const { system, user } = buildPrompts(title, settings);

			const response = await client.messages.create({
				model: settings.claudeModel,
				max_tokens: 8192,
				system,
				messages: [
					{ role: 'user', content: user },
				],
			});

			const textBlock = response.content.find((block) => block.type === 'text');
			const editedContent = textBlock ? textBlock.text : '';

			if (!editedContent) {
				return {
					content: '',
					error: 'Claude로부터 응답을 받지 못했습니다.',
				};
			}

			return { content: editedContent };
		} catch (error) {
			return {
				content: '',
				error: `Claude API 오류: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	if (settings.provider === 'gemini') {
		if (!settings.geminiApiKey) {
			return {
				content: '',
				error: 'Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
			};
		}

		try {
			const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
			const { system, user } = buildPrompts(title, settings);

			const response = await ai.models.generateContent({
				model: settings.geminiModel,
				contents: `${system}\n\n${user}`,
			});

			const editedContent = response.text;

			if (!editedContent) {
				return {
					content: '',
					error: 'Gemini로부터 응답을 받지 못했습니다.',
				};
			}

			return { content: editedContent };
		} catch (error) {
			return {
				content: '',
				error: `Gemini API 오류: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	// Default to OpenAI
	if (!settings.apiKey) {
		return {
			content: '',
			error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
		};
	}

	try {
		const client = new OpenAI({
			apiKey: settings.apiKey,
			baseURL: resolveBaseUrl(settings.apiUrl),
			dangerouslyAllowBrowser: true,
		});

		const { system, user } = buildPrompts(title, settings);

		const response = await client.chat.completions.create({
			model: settings.model,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
		});

		const editedContent =
			response.choices?.[0]?.message?.content || '';

		if (!editedContent) {
			return {
				content: '',
				error: 'GPT로부터 응답을 받지 못했습니다.',
			};
		}

		return { content: editedContent };
	} catch (error) {
		return {
			content: '',
			error: `API 오류: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

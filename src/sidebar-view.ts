import { ItemView, Notice, TFile } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import type { GPTEditorPluginInterface } from './types';
import { callGPTAPI } from './gpt-service';
import { getAllPresets } from './settings';

export const VIEW_TYPE_GPT_EDITOR = 'gpt-editor-view';

export class GPTEditorView extends ItemView {
	plugin: GPTEditorPluginInterface;
	private statusWrapperEl: HTMLElement | null = null;
	private statusContainerEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: GPTEditorPluginInterface) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_GPT_EDITOR;
	}

	getDisplayText() {
		return 'AI 문서 편집기';
	}

	getIcon() {
		return 'sparkles';
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('gpt-editor-view');

		// 제목
		const titleEl = contentEl.createEl('h2', {
			text: 'AI 문서 편집기',
		});
		titleEl.addClass('gpt-editor-title');

		// 간단한 설명
		const descEl = contentEl.createEl('p', {
			text: '현재 열린 마크다운 문서의 제목에 맞는 문서를 생성합니다.',
		});
		descEl.addClass('gpt-editor-description');

		// 프리셋 선택 드롭다운
		const presetRow = contentEl.createDiv('gpt-editor-preset-row');
		const presetLabel = presetRow.createEl('label', {
			text: '프리셋',
			cls: 'gpt-editor-preset-label',
		});

		const presetSelect = presetRow.createEl('select', {
			cls: 'gpt-editor-preset-select dropdown',
		});

		const allPresets = getAllPresets(this.plugin.settings);
		for (const preset of allPresets) {
			const option = presetSelect.createEl('option', {
				text: preset.isBuiltIn ? `[기본] ${preset.name}` : preset.name,
				value: preset.id,
			});
			if (preset.id === this.plugin.settings.activePresetId) {
				option.selected = true;
			}
		}

		presetSelect.addEventListener('change', async () => {
			this.plugin.settings.activePresetId = presetSelect.value;
			const selected = allPresets.find((p) => p.id === presetSelect.value);
			if (selected) {
				this.plugin.settings.prompt = selected.prompt;
			}
			await this.plugin.saveSettings();
		});

		presetLabel.htmlFor = 'gpt-editor-preset-select';
		presetSelect.id = 'gpt-editor-preset-select';

		// 버튼
		const buttonEl = contentEl.createEl('button', {
			text: '문서 생성하기',
		});
		buttonEl.addClass('mod-cta', 'gpt-editor-button');
		buttonEl.addEventListener('click', async () => {
			await this.handleEditDocument();
		});

		// 상태 로그 및 컨트롤 영역
		this.createStatusWrapper();
	}

	async handleEditDocument() {
		const activeFile =
			this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('열린 문서가 없습니다.');
			return;
		}

		if (!activeFile.path.endsWith('.md')) {
			new Notice('마크다운 파일만 편집할 수 있습니다.');
			return;
		}

		const title = activeFile.basename;

		const statusContainer = this.ensureStatusContainer();
		const filePath = activeFile.path;

		const statusItem = statusContainer.createEl('div', {
			cls: 'gpt-editor-status',
		});
		statusItem.addClass('is-loading');
		statusItem.setText(`'${title}' 문서를 생성하는 중...`);
		statusItem.dataset.filePath = filePath;

		let result: Awaited<ReturnType<typeof callGPTAPI>>;
		try {
			result = await callGPTAPI(
				title,
				this.plugin.settings
			);
		} catch (error) {
			statusItem.removeClass('is-loading');
			statusItem.addClass('is-error');
			const errorMessage =
				error instanceof Error
					? error.message
					: String(error);
			statusItem.setText(
				`'${title}' 문서 생성 실패: ${errorMessage}`
			);
			new Notice(
				`'${title}' 문서 생성 실패: ${errorMessage}`
			);
			return;
		}

		statusItem.removeClass('is-loading');

		if (result.error) {
			new Notice(result.error);
			statusItem.addClass('is-error');
			statusItem.setText(
				`'${title}' 문서 생성 실패: ${result.error}`
			);
			return;
		}

		try {
			await this.app.vault.modify(activeFile, result.content);
			new Notice(
				`'${title}' 문서 생성이 완료되었습니다!`
			);
			statusItem.addClass('is-success');
			statusItem.addClass('is-clickable');
			statusItem.setText(
				`'${title}' 문서 생성 완료!`
			);
			statusItem.addEventListener('click', () => {
				const targetPath = statusItem.dataset.filePath;
				if (targetPath) {
					this.openNote(targetPath);
				}
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: String(error);
			new Notice(`문서 저장 오류: ${errorMessage}`);
			statusItem.addClass('is-error');
			statusItem.setText(
				`'${title}' 문서 저장 오류: ${errorMessage}`
			);
		}
	}

	async onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.statusWrapperEl = null;
		this.statusContainerEl = null;
	}

	private ensureStatusContainer(): HTMLElement {
		if (!this.statusWrapperEl || !this.statusWrapperEl.isConnected) {
			return this.createStatusWrapper();
		}

		if (
			!this.statusContainerEl ||
			!this.statusContainerEl.isConnected
		) {
			this.statusContainerEl =
				this.statusWrapperEl.createDiv(
					'gpt-editor-status-log'
				);
		}

		return this.statusContainerEl;
	}

	private createStatusWrapper(): HTMLElement {
		this.statusWrapperEl = this.contentEl.createDiv(
			'gpt-editor-status-wrapper'
		);

		this.statusContainerEl =
			this.statusWrapperEl.createDiv(
				'gpt-editor-status-log'
			);

		const clearButton =
			this.statusWrapperEl.createEl('button', {
				text: '로그 비우기',
			});
		clearButton.addClass('gpt-editor-clear-button');
		clearButton.addEventListener('click', () => {
			this.clearStatusLog();
		});

		return this.statusContainerEl;
	}

	private clearStatusLog() {
		if (!this.statusContainerEl) {
			return;
		}
		this.statusContainerEl.empty();
	}

	private openNote(filePath: string) {
		const abstractFile =
			this.app.vault.getAbstractFileByPath(filePath);
		if (!(abstractFile instanceof TFile)) {
			new Notice('파일을 열 수 없습니다.');
			return;
		}
		const leaf = this.app.workspace.getLeaf(true);
		if (!leaf) {
			new Notice('파일을 열기 위한 창을 찾을 수 없습니다.');
			return;
		}
		leaf.openFile(abstractFile);
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
	}
}

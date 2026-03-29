import { PluginSettingTab, Setting } from 'obsidian';
import { GPTEditorPluginInterface } from './types';
import { getAllPresets, generatePresetId, PromptPreset } from './settings';

export class GPTEditorSettingTab extends PluginSettingTab {
	plugin: GPTEditorPluginInterface;

	constructor(plugin: GPTEditorPluginInterface) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'AI 문서 편집기 설정' });

		// --- AI 제공자 선택 ---
		new Setting(containerEl)
			.setName('AI 제공자')
			.setDesc('사용할 AI 서비스를 선택하세요.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('openai', 'OpenAI')
					.addOption('gemini', 'Google Gemini')
					.addOption('claude', 'Anthropic Claude')
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value as 'openai' | 'gemini' | 'claude';
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// --- Provider-specific settings ---
		if (this.plugin.settings.provider === 'openai') {
			containerEl.createEl('h3', { text: 'OpenAI 설정' });
			new Setting(containerEl)
				.setName('OpenAI API 키')
				.setDesc('OpenAI API 키를 입력하세요. https://platform.openai.com/api-keys 에서 발급받을 수 있습니다.')
				.addText((text) => {
					text.setPlaceholder('sk-...')
						.setValue(this.plugin.settings.apiKey)
						.inputEl.type = 'password';
					text.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
				});

			new Setting(containerEl)
				.setName('모델')
				.setDesc('사용할 GPT 모델을 선택하세요.')
				.addDropdown((dropdown) =>
					dropdown
						.addOption('gpt-4', 'GPT-4')
						.addOption('gpt-4-turbo', 'GPT-4 Turbo')
						.addOption('gpt-4o', 'GPT-4o')
						.addOption('gpt-4o-mini', 'GPT-4o Mini')
						.setValue(this.plugin.settings.model)
						.onChange(async (value) => {
							this.plugin.settings.model = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(containerEl)
				.setName('API URL')
				.setDesc('OpenAI API 엔드포인트 URL (기본값 사용 권장)')
				.addText((text) =>
					text
						.setPlaceholder('https://api.openai.com/v1')
						.setValue(this.plugin.settings.apiUrl)
						.onChange(async (value) => {
							this.plugin.settings.apiUrl = value;
							await this.plugin.saveSettings();
						})
				);
		} else if (this.plugin.settings.provider === 'gemini') {
			containerEl.createEl('h3', { text: 'Google Gemini 설정' });
			new Setting(containerEl)
				.setName('Gemini API 키')
				.setDesc('Google Gemini API 키를 입력하세요.')
				.addText((text) => {
					text.setPlaceholder('AIza...')
						.setValue(this.plugin.settings.geminiApiKey)
						.inputEl.type = 'password';
					text.onChange(async (value) => {
						this.plugin.settings.geminiApiKey = value;
						await this.plugin.saveSettings();
					});
				});

			new Setting(containerEl)
				.setName('모델')
				.setDesc('사용할 Gemini 모델을 선택하세요.')
				.addDropdown((dropdown) =>
					dropdown
						.addOption('gemini-3-pro-preview', 'Gemini 3 Pro Preview')
						.addOption('gemini-pro', 'Gemini Pro')
						.setValue(this.plugin.settings.geminiModel)
						.onChange(async (value) => {
							this.plugin.settings.geminiModel = value;
							await this.plugin.saveSettings();
						})
				);
		} else if (this.plugin.settings.provider === 'claude') {
			containerEl.createEl('h3', { text: 'Anthropic Claude 설정' });
			new Setting(containerEl)
				.setName('Claude API 키')
				.setDesc('Anthropic API 키를 입력하세요. https://console.anthropic.com 에서 발급받을 수 있습니다.')
				.addText((text) => {
					text.setPlaceholder('sk-ant-...')
						.setValue(this.plugin.settings.claudeApiKey)
						.inputEl.type = 'password';
					text.onChange(async (value) => {
						this.plugin.settings.claudeApiKey = value;
						await this.plugin.saveSettings();
					});
				});

			new Setting(containerEl)
				.setName('모델')
				.setDesc('사용할 Claude 모델을 선택하세요.')
				.addDropdown((dropdown) =>
					dropdown
						.addOption('claude-sonnet-4-20250514', 'Claude Sonnet 4')
						.addOption('claude-opus-4-20250514', 'Claude Opus 4')
						.addOption('claude-haiku-3-5-20241022', 'Claude Haiku 3.5')
						.setValue(this.plugin.settings.claudeModel)
						.onChange(async (value) => {
							this.plugin.settings.claudeModel = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// --- 문서 생성 설정 ---
		containerEl.createEl('h3', { text: '문서 생성 설정' });

		new Setting(containerEl)
			.setName('문서 길이')
			.setDesc('생성할 문서의 길이를 선택하세요.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('short', '짧게 (500자 내외)')
					.addOption('medium', '보통 (1500자 내외)')
					.addOption('long', '길게 (3000자 내외)')
					.addOption('very-long', '매우 길게 (5000자 이상)')
					.setValue(this.plugin.settings.documentLength)
					.onChange(async (value) => {
						this.plugin.settings.documentLength = value as GPTEditorPluginInterface['settings']['documentLength'];
						await this.plugin.saveSettings();
					})
			);

		// --- 프롬프트 프리셋 설정 ---
		containerEl.createEl('h3', { text: '프롬프트 프리셋' });

		const allPresets = getAllPresets(this.plugin.settings);

		// 프리셋 선택 드롭다운
		new Setting(containerEl)
			.setName('프리셋 선택')
			.setDesc('저장된 프리셋을 선택하면 프롬프트가 자동으로 변경됩니다.')
			.addDropdown((dropdown) => {
				for (const preset of allPresets) {
					const label = preset.isBuiltIn ? `[기본] ${preset.name}` : preset.name;
					dropdown.addOption(preset.id, label);
				}
				dropdown.setValue(this.plugin.settings.activePresetId);
				dropdown.onChange(async (value) => {
					this.plugin.settings.activePresetId = value;
					const selected = allPresets.find((p) => p.id === value);
					if (selected) {
						this.plugin.settings.prompt = selected.prompt;
					}
					await this.plugin.saveSettings();
					this.display();
				});
			});

		// 현재 프롬프트 편집
		const promptDescEl = containerEl.createEl('div', { cls: 'setting-item' });
		promptDescEl.createEl('div', {
			cls: 'setting-item-info',
		}).createEl('div', {
			cls: 'setting-item-name',
			text: '프롬프트 내용',
		});

		const textareaEl = containerEl.createEl('textarea', {
			cls: 'gpt-editor-prompt-textarea',
		});
		textareaEl.value = this.plugin.settings.prompt;
		textareaEl.rows = 10;
		textareaEl.addEventListener('change', async () => {
			this.plugin.settings.prompt = textareaEl.value;
			// 커스텀 프리셋이면 프리셋 내용도 업데이트
			const activePreset = this.plugin.settings.promptPresets.find(
				(p) => p.id === this.plugin.settings.activePresetId
			);
			if (activePreset) {
				activePreset.prompt = textareaEl.value;
			}
			await this.plugin.saveSettings();
		});

		// 프리셋 관리 버튼들
		const buttonRow = containerEl.createDiv('gpt-editor-preset-buttons');

		// 새 프리셋으로 저장
		const saveAsButton = buttonRow.createEl('button', {
			text: '현재 프롬프트를 새 프리셋으로 저장',
			cls: 'gpt-editor-preset-button',
		});
		saveAsButton.addEventListener('click', async () => {
			const name = prompt('프리셋 이름을 입력하세요:');
			if (!name || !name.trim()) return;

			const newPreset: PromptPreset = {
				id: generatePresetId(),
				name: name.trim(),
				prompt: this.plugin.settings.prompt,
			};
			this.plugin.settings.promptPresets.push(newPreset);
			this.plugin.settings.activePresetId = newPreset.id;
			await this.plugin.saveSettings();
			this.display();
		});

		// 현재 커스텀 프리셋 삭제 (기본 프리셋은 삭제 불가)
		const activePreset = allPresets.find(
			(p) => p.id === this.plugin.settings.activePresetId
		);
		if (activePreset && !activePreset.isBuiltIn) {
			const deleteButton = buttonRow.createEl('button', {
				text: '현재 프리셋 삭제',
				cls: 'gpt-editor-preset-button gpt-editor-preset-delete',
			});
			deleteButton.addEventListener('click', async () => {
				if (!confirm(`'${activePreset.name}' 프리셋을 삭제하시겠습니까?`)) return;

				this.plugin.settings.promptPresets = this.plugin.settings.promptPresets.filter(
					(p) => p.id !== activePreset.id
				);
				this.plugin.settings.activePresetId = 'encyclopedia';
				const fallback = allPresets.find((p) => p.id === 'encyclopedia');
				if (fallback) {
					this.plugin.settings.prompt = fallback.prompt;
				}
				await this.plugin.saveSettings();
				this.display();
			});

			// 이름 변경
			const renameButton = buttonRow.createEl('button', {
				text: '이름 변경',
				cls: 'gpt-editor-preset-button',
			});
			renameButton.addEventListener('click', async () => {
				const newName = prompt('새 이름을 입력하세요:', activePreset.name);
				if (!newName || !newName.trim()) return;

				const target = this.plugin.settings.promptPresets.find(
					(p) => p.id === activePreset.id
				);
				if (target) {
					target.name = newName.trim();
					await this.plugin.saveSettings();
					this.display();
				}
			});
		}
	}
}

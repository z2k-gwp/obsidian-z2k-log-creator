import { LargeNumberLike } from 'crypto';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createDailyNote } from 'obsidian-daily-notes-interface';

interface MyPluginSettings {
	mySetting: string;
	debugLevel: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	debugLevel: 100
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Debug info
		if (this.settings.debugLevel >= 100) {
			console.log("Z2K Log - Creator: Loading");
		}

		// Record our load time
		var loadMoment = (window as any).moment(Date.now())

		// This creates an icon in the left ribbon.
		let ribbonIconEl = this.addRibbonIcon('crossed-star', 'Z2K Log Creator', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.debugLevel >= 10) {
			let statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText('Last Z2K Log Creator Load: ' + loadMoment.format('YYYY-MM-DD hh:mm:ss'));
		}


		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				let markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) {
			console.log("Z2K Log - Creator: Unloading.");
		}

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	// ======================================================================================================
	// ======================================================================================================

/*
	async checkForDailyNoteExistence() {

	}


	async createZ2KDailyNote() { 

		if (!appHasDailyNotesPluginLoaded()) {
			new Notice("Daily notes plugin is not loaded");
			return;
		}
		const moment = (window as any).moment(Date.now());
		const allDailyNotes = getAllDailyNotes();
		let dailyNote = getDailyNote(moment, allDailyNotes);
		if (!dailyNote) {
			/// Prevent daily note from being created on existing check
			if (parameters.exists === "true") {
				parameters.filepath = await getDailyNotePath(moment);
			} else {
				dailyNote = await createDailyNote(moment);
				createdDailyNote = true;
			}
		}
		if (dailyNote !== undefined) {
			parameters.filepath = dailyNote.path;
		}		
	}
*/

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { appHasDailyNotesPluginLoaded, createDailyNote, getAllDailyNotes, getDailyNote, getDailyNoteSettings } from "obsidian-daily-notes-interface";
import type { Moment } from "moment";

// ======================================================================================================
// obsidian-z2k-log-creator Obsidian Plugin
// ======================================================================================================
// Please see https://github.com/z2k-gwp/obsidian-z2k-log-creator for more information


interface MyPluginSettings {
	mySetting: string;
	debugLevel: number;
	checkForZ2KDailyNoteSettingsCompliance: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	debugLevel: 100,
	checkForZ2KDailyNoteSettingsCompliance: true
}

export default class Z2KLogCreatorPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Debug info
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: Loading"); }

		// Record our load time
		var loadMoment = (window as any).moment(Date.now())

		// This creates an icon in the left ribbon.
		let ribbonIconEl = this.addRibbonIcon('crossed-star', 'Z2K Log Creator', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const moment = (window as any).moment(Date.now());
			var dailyNote = this.createZ2KDailyNote(moment);
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.debugLevel >= 10) {
			let statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText('Last Z2K Log Creator Load: ' + loadMoment.format('YYYY-MM-DD hh:mm:ss'));
		}

		// Add a command to trigger creating the daily log
		this.addCommand({
			id: 'create-Z2K-daily-log',
			name: "Create today's daily log",
			callback: () => {
				const currentMoment = (window as any).moment(Date.now());
				var dailyNote = this.createZ2KDailyNote(currentMoment);
			}
		});
		// Add a command to trigger creating the daily log - for a different day
		this.addCommand({
			id: 'create-Z2K-daily-log-for-selection',
			name: "Create a daily log for the date selected in the editor",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let editorMoment = (window as any).moment(editor.getSelection());
				// TODO: needs error checking!
				var dailyNote = this.createZ2KDailyNote(editorMoment);
				// editor.replaceSelection("[[" + dailyNote.name + "]]");
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'create-Z2K-daily-log-for-given-date',
			name: "Create a daily log for a given date",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// TODO: display modal question to user
				// var dailyNote = this.createZ2KDailyNote(editorMoment);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Z2KLogCreatorSettingTab(this.app, this));

	}

	onunload() {

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: Unloading."); }

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	// ======================================================================================================
	// Z2K Specific Functions
	// ======================================================================================================
	// Ideally, these function should be moved to one or more Z2K Helper classes so that they can be shared 
	// across Z2K functions


	// ------------------------------------------------------------------------------------------------------
	// Create Z2K Daily Note
	// ------------------------------------------------------------------------------------------------------
	// This function creates a daily note for the day. It uses the settings from the "Daily Notes" core 
	// plugin to figure out where to save it. 
	//
	// Parameters:
	// 		dateToCreate : a  Moment variable representing the day to create
	//
	// Returns:
	//		Filehandle to the actual note
	// 
	// If the note already exists, it simply returns quietly, passing the file handle to the existing note.
	//
	// Note: to call on today's note: 
	//      const moment = (window as any).moment(Date.now());
	//      let dailyNote = createZ2KDailyNote(moment)
	//
	async createZ2KDailyNote(dateToCreate: Moment): Promise<TFile> { 

		let createdDailyNote = false;

		// Sanity Checks
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: createZ2KDailyNote() - Entered"); }
		if (!appHasDailyNotesPluginLoaded()) {
			new Notice("The Daily Notes core plugin is currently not loaded. Z2K uses this plugin for specifying how to find your daily note.");
			return;
		}

		// Check for Z2K Compliance
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: createZ2KDailyNote() - Checking for Z2K Compliance in Settings"); }
		if (this.settings.checkForZ2KDailyNoteSettingsCompliance) {
			const { format, folder, template} = getDailyNoteSettings();
			// TODO: RequiredFolder needs fixing to support YYYY
			const requiredFormat = "YYYY-MM-DD", requiredFolder = "~Logs/" + dateToCreate.format("YYYY"), requiredTemplate = "~Templates/~Logs - Daily";
			let errorMessages = "";
			if ((format != requiredFormat) && (format != "")) {
				errorMessages += "The Date Format is not Z2K compliant. It should be '" + requiredFormat + "', but is currently '" + format + "'\n";
			}
			if (folder != requiredFolder) {
				errorMessages += "The New File Location is not Z2K compliant. It should be '"+ requiredFolder +"', but is currently '" + folder + "'\n";
			}
			if (template != requiredTemplate) {
				errorMessages += "The Template file Location is not Z2K compliant. It should be '"+ requiredTemplate +"', but is currently '" + template + "'\n";
			}
			if (errorMessages != "") {
				// Could use alert, but Notice is less obtrusive
				new Notice("The Daily Notes core plugin's settings are not Z2K Compliant:\n\n" + errorMessages + "\nNote: you can disable this warning in the plugin's settings.");
			}

		}
	
		// Get the daily note, and if not there, then create it
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: createZ2KDailyNote() - Check for previously created log file for the day."); }
		const allDailyNotes = getAllDailyNotes();  // Daily Notes routines like to work off of a cache - this fetches the cache
		let dailyNote = getDailyNote(dateToCreate, allDailyNotes);
		if (dailyNote == null) {
			if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: createZ2KDailyNote() - Creating new log file for the day."); }
			dailyNote = await createDailyNote(dateToCreate);
			if (dailyNote !== undefined) {
				createdDailyNote = true;
			}
		}

		// Now flesh out the fields. This saves the file when done.
		if (dailyNote != null) {
			if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: createZ2KDailyNote() - Fleshing out automated fields."); }
			var success = await this.fleshOutDailyNoteAutomatedFields(dateToCreate,dailyNote);
		}


		// Reminder:
		// console.log("Basename: " + dailyNote.basename);	// 2021-10-24
		// console.log("Name: " + dailyNote.name);			// 2021-10-24.md
		// console.log("Path: " + dailyNote.path);			// ~Logs/2021/2021-10-24.md


		return dailyNote;
	}


	// ------------------------------------------------------------------------------------------------------
	// fleshOutDailyNoteAutomatedFields
	// ------------------------------------------------------------------------------------------------------
	// This function takes a freshly created daily log file and fills out the simple {{fields}}. It saves the
	// file when done.
	//
	// Parameters:
	// 		dateToUse 		: a Moment variable representing the day being used for the log entry
	//		dailyNoteFile 	: a TFile that holds the Daily Note File
	//
	// Returns:
	//		boolean			: true if it succeeded, false if it failed.
	//
	async fleshOutDailyNoteAutomatedFields(dateToUse: Moment, dailyNoteFile: TFile): Promise<Boolean> {

		// Sanity checking
		if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: fleshOutDailyNoteAutomatedFields() - Entered"); }
		if (dailyNoteFile == null) { 
			new Notice("Attempted to flesh out the fields in the daily note for a day, but failed to find the file.")
			return false; 
		}
		if (!(dailyNoteFile instanceof TFile)) {
			if (this.settings.debugLevel > 5) {
				new Notice("Invalid parameter passed to fleshOutDailyNoteAutomatedFields()");
			}
			return false; 
		}

		try {
			// Replace Z2K's Automated Fields
			if (this.settings.debugLevel >= 100) { console.log("Z2K Log - Creator: fleshOutDailyNoteAutomatedFields() - Replacing Z2K's Automated Fields"); }
			let dailyNoteFileData = await this.app.vault.read(dailyNoteFile);
			const Z2KDateFormat = "YYYY-MM-DD";
			dailyNoteFileData = dailyNoteFileData
				.replace(/{{\s*date\s*}}/gi, dateToUse.format(Z2KDateFormat))
				.replace(/{{\s*time\s*}}/gi, dateToUse.format("HH:mm"))
				.replace(/{{\s*yesterday\s*}}/gi, dateToUse.clone().subtract(1, "day").format(Z2KDateFormat))
				.replace(/{{\s*yesterdayLink\s*}}/gi, "[[" + dateToUse.clone().subtract(1, "day").format(Z2KDateFormat) + "]]")
				.replace(/{{\s*tomorrow\s*}}/gi, dateToUse.clone().add(1, "d").format(Z2KDateFormat))
				.replace(/{{\s*tomorrowLink\s*}}/gi, "[[" + dateToUse.clone().add(1, "d").format(Z2KDateFormat) + "]]")
				.replace(/{{\s*dayOfWeek\s*}}/gi, dateToUse.format("dddd"))
				.replace(/{{\s*today\s*}}/gi, dateToUse.format(Z2KDateFormat))
				.replace(/{{\s*todayLink\s*}}/gi, "[[" + dateToUse.format(Z2KDateFormat) + "]]")
				.replace(/{{\s*weekNum\s*}}/gi, dateToUse.format("YYYY") + "-w" + dateToUse.format("ww"))
				.replace(/{{\s*weekNumLink\s*}}/gi, "[[" + dateToUse.format("YYYY") + "-w" + dateToUse.format("ww") + "]]")
				.replace(/{{\s*timestamp\s*}}/gi, dateToUse.format("YYYYMMDDHHmm"))

				.replace(/{{\s*title\s*}}/gi, dailyNoteFile.basename)
				.replace(/{{\s*cardTitle\s*}}/gi, dailyNoteFile.basename)
				.replace(/{{\s*cardTitleLink\s*}}/gi, "[[" + dailyNoteFile.basename + "]]")

				.replace(/{{\s*#Card\/Type\/Template\s*}}/gi, ".:Card/Activated");


			// Now Append our action
			// Note: This needs to be moved to a helper function (and controlled by a setting) - just note that the log you want to append to may not be *this* log.
			// const currentMoment = (window as any).moment(Date.now());
			// dailyNoteFileData += - currentMoment.Format("YYYY-MM-DD, HH:mm") + ", " + this.manifest.name + ", Fleshed out Automated Fields for [[]]"

			// Now write the file to disk
			await this.app.vault.adapter.write(dailyNoteFile.path, dailyNoteFileData);
			return true;

		}
		catch (err) {
			console.error("Failed to create file: " + dailyNoteFile.path + "/" + dailyNoteFile.name + dailyNoteFile.extension, err);
			new Notice("Internal error fleshing out automated fields in the new file.");
			return false;
		}
	}
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

class Z2KLogCreatorSettingTab extends PluginSettingTab {
	plugin: Z2KLogCreatorPlugin;

	constructor(app: App, plugin: Z2KLogCreatorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Advanced Settings'});

		// TODO: Does saveSettings need to be await?
		new Setting(containerEl)
			.setName('Check for Z2K Compliance for Daily Note plugin')
			.setDesc('Check the Daily Note plugin settings are Z2K Compliant')
			.setDisabled(this.plugin.settings.checkForZ2KDailyNoteSettingsCompliance)
			.addToggle(cb => cb.onChange(value => {
                this.plugin.settings.checkForZ2KDailyNoteSettingsCompliance = value;
                this.plugin.saveSettings();				
			}).setValue(this.plugin.settings.checkForZ2KDailyNoteSettingsCompliance))

		new Setting(containerEl)
			.setName("Debug Level (integer)")
			.addText(cb => cb.onChange(value => {
				this.plugin.settings.debugLevel = +value;
				this.plugin.saveSettings();
			}).setValue(this.plugin.settings.debugLevel.toString()));

	}
}

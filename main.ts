import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { appHasDailyNotesPluginLoaded, createDailyNote, getAllDailyNotes, getDailyNote, getDailyNoteSettings } from "obsidian-daily-notes-interface";
import type { Moment } from "moment";


// +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=
// obsidian-z2k-log-creator Obsidian Plugin
// +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=
//
// Please see https://github.com/z2k-gwp/obsidian-z2k-log-creator for more information
//
//


interface IZ2kLogCreatorSettings {
	mySetting: string;
	debugLevel: number;
	useRibbonButton: boolean;
	createLogOnStartup: boolean;
	checkForZ2KDailyNoteSettingsConsistency: boolean;
}

const DEFAULT_SETTINGS: IZ2kLogCreatorSettings = {
	mySetting: 'default',
	debugLevel: 100,
	useRibbonButton: true,
	createLogOnStartup: false,
	checkForZ2KDailyNoteSettingsConsistency: true
}



// ======================================================================================================
// Z2KLogCreatorPlugin Plugin Class
// ======================================================================================================
// 
export default class Z2KLogCreatorPlugin extends Plugin {
	settings: IZ2kLogCreatorSettings;

	private ribbonEl: HTMLElement;

	/* ------------------------------------------------------------------------------------------------------ */
	// onload
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * Performed when application first loads the plugin
	 * @remarks
	 * - This is done fairly early and synchronously - so set things up and then get out of the way. 
	 * - Hook the onLayoutReady event to do more complicated and async tasks.
	 */
	async onload() {

		// Initialization
		this.ribbonEl = null;

		// Load our settings first, as this controls what we do here.
		await this.loadSettings();

		// Log debug info
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": Loading"); }

		// Bind to the onLayoutReady event so we can continue our initialization once the system has settled down.
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.debugLevel >= 10) {
			var loadMoment = (window as any).moment(Date.now())
			let statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText('Last Z2K Log Creator Load: ' + loadMoment.format('YYYY-MM-DD hh:mm:ss'));
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Z2KLogCreatorSettingTab(this.app, this));

	}

	/* ------------------------------------------------------------------------------------------------------ */
	// onLayoutReady
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * Event handler for when the layout is done and the plugin can perform more intense actions
	 */
	 async onLayoutReady():Promise<void> {

		// Todo: I forced this to be a async declaration, but the source shows it as sync
		// Thus, I don't think this will allow be to create a synch call to createZ2KDailyLog()

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": Layout is ready...."); }

		// Configure our stuff
		this.configureRibbonIcons();
		this.configureCommands();

		// Create daily log
		if (this.settings.createLogOnStartup) { 
			const moment = (window as any).moment(Date.now());
			var dailyNote = await this.createZ2KDailyLog(moment);
		}
	}

	/* ------------------------------------------------------------------------------------------------------ */
	// configureRibbonIcons
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * Helper routine for configuring any ribbon icons we have
	 */
	private configureRibbonIcons() {
		this.ribbonEl?.detach();

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": Configuring Ribbon Icons...."); }

		// Create our Ribbon Button (if configured to do so)
		if (this.settings.useRibbonButton) {

			// Default icons: 'logo-crystal', 'create-new', 'trash', 'search', 'right-triangle', 'document', 'folder', 'pencil', 'left-arrow', 'right-arrow', 'three-horizontal-bars', 'dot-network', 'audio-file', 'image-file', 'pdf-file', 'gear', 'documents', 'blocks', 'go-to-file', 'presentation', 'cross-in-box', 'microphone', 'microphone-filled', 'two-columns', 'link', 'popup-open', 'checkmark', 'hashtag', 'left-arrow-with-tail', 'right-arrow-with-tail', 'lines-of-text', 'vertical-three-dots', 'pin', 'magnifying-glass', 'info', 'horizontal-split', 'vertical-split', 'calendar-with-checkmark', 'sheets-in-box', 'up-and-down-arrows', 'broken-link', 'cross', 'any-key', 'reset', 'star', 'crossed-star', 'dice', 'filled-pin', 'enter', 'help', 'vault', 'open-vault', 'paper-plane', 'bullet-list', 'uppercase-lowercase-a', 'star-list', 'expand-vertically', 'languages', 'switch', 'pane-layout', 'install'
			this.ribbonEl = this.addRibbonIcon(
				'lines-of-text', 
				"Create Today's Daily Log", 
				async (evt: MouseEvent) => {
					// Called when the user clicks the icon.
					const moment = (window as any).moment(Date.now());
					var dailyNote = await this.createZ2KDailyLog(moment);
				});

			// Provide a class to the ribbon button in case someone wants to modify it with CSS (e.g. to hide)
			this.ribbonEl.addClass('z2k-log-creator-ribbon-class');

			// If we want to add a right-click context menu, here is how periodic notes did it:
			// this.ribbonEl.addEventListener("contextmenu", (ev: MouseEvent) => {
			// 	showFileMenu(this.app, this.settings, {
			// 	  x: ev.pageX,
			// 	  y: ev.pageY,
			// 	});

		}		

	}

	/* ------------------------------------------------------------------------------------------------------ */
	// configureCommands
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * Helper routine for configuring any commands that we want to expose to the user
	 */
	 private configureCommands() {

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": Configuring Commands"); }

		// Add a command to trigger creating the daily log
		this.addCommand({
			id: 'create-Z2K-daily-log',
			name: "Create today's daily log",
			callback: async () => {
				const currentMoment = (window as any).moment(Date.now());
				var dailyNote = this.createZ2KDailyLog(currentMoment);
			}
		});

		// Add a command to trigger creating the daily log - for a different day based on what text is currently selected
		this.addCommand({
			id: 'create-Z2K-daily-log-for-selection',
			name: "Create a daily log for the date selected in the editor",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				let editorMoment = (window as any).moment(editor.getSelection());
				if (editorMoment.IsValid()) { 
					let dailyNote = await this.createZ2KDailyLog(editorMoment);
					editor.replaceSelection("[[" + dailyNote.name + "]]");	
				} else {
					new Notice("Could not figure out a date from the selected text.")
				}
			}
		});

		// Add a command to import the daily notes configuration
		this.addCommand({
			id: 'z2k-log-creator-import-settings',
			name: "Import settings from Daily Notes plugin",
			callback: () => {
				this.importDailyNotesSettings();
			}
		});

		// Add a command to trigger creating the daily log for a user-specified date
		// NOT YET IMPLEMENTED
		/*this.addCommand({
			id: 'create-Z2K-daily-log-for-given-date',
			name: "Create a daily log for a given date",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// TODO: display modal question to user
				// var dailyNote = this.createZ2KDailyNote(editorMoment);
			}
		});
		*/

	}	

	/* ------------------------------------------------------------------------------------------------------ */
	// onunload
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * Event handler for when the plugin is just about to be unloaded
	 */
	onunload() {

		// Debug info - output to the console
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": Unloading."); }

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private onSettingsUpdate(): void {
		// this.configureCommands(); - Not really needed, as nothing has changed
		this.configureRibbonIcons();
	}



	// ======================================================================================================
	// Z2K Specific Functions
	// ======================================================================================================
	// Ideally, these function should be moved to one or more Z2K Helper classes so that they can be shared 
	// across Z2K functions


	/* ------------------------------------------------------------------------------------------------------ */
	// createZ2KDailyLog
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * This function creates a daily note for the day. It uses the settings from the "Daily Notes" core 
	 * plugin to figure out where to save it. 
	 * 
	 * @remarks
	 * - If the note already exists, it simply returns quietly, passing the file handle to the existing note.
	 * 
	 * @example // Tip: to call on today's note:
	 *      const moment = (window as any).moment(Date.now());
	 *      let dailyNote = createZ2KDailyNote(moment)
	 * 
	 * @param  {Moment} dateToCreate - a Moment variable representing the day to create
	 * @returns Promise - Filehandle to the actual note
	 */
	async createZ2KDailyLog(dateToCreate: Moment): Promise<TFile> { 

		let createdDailyNote = false;

		// Sanity Checks
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": createZ2KDailyNote() - Entered"); }
		if (!appHasDailyNotesPluginLoaded()) {
			new Notice("The Daily Notes core plugin is currently not loaded. Z2K uses this plugin for specifying how to find your daily note.");
			return;
		}

		// Check for Z2K Consistency
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": createZ2KDailyNote() - Checking for Z2K Consistency in Settings"); }
		if (this.settings.checkForZ2KDailyNoteSettingsConsistency) {
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
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": createZ2KDailyNote() - Check for previously created log file for the day."); }
		const allDailyNotes = getAllDailyNotes();  // Daily Notes routines like to work off of a cache - this fetches the cache
		let dailyNote = getDailyNote(dateToCreate, allDailyNotes);
		if (dailyNote == null) {
			if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": createZ2KDailyNote() - Creating new log file for the day."); }
			dailyNote = await createDailyNote(dateToCreate);
			if (dailyNote !== undefined) {
				createdDailyNote = true;
			}
		}

		// Now flesh out the fields. This saves the file when done.
		if (dailyNote != null) {
			if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": createZ2KDailyNote() - Fleshing out automated fields."); }
			var success = await this.fleshOutDailyNoteAutomatedFields(dateToCreate,dailyNote);
		}


		// Reminder:
		// console.log("Basename: " + dailyNote.basename);	// 2021-10-24
		// console.log("Name: " + dailyNote.name);			// 2021-10-24.md
		// console.log("Path: " + dailyNote.path);			// ~Logs/2021/2021-10-24.md


		return dailyNote;
	}


	/* ------------------------------------------------------------------------------------------------------ */
	// fleshOutDailyNoteAutomatedFields
	/* ------------------------------------------------------------------------------------------------------ */
	/**
	 * This function takes a freshly created daily log file and fills out the simple {{fields}}. It saves the
	 * file when done.
	 *
	 * @param  {Moment} dateToUse - a Moment variable representing the day being used for the log entry
	 * @param  {TFile} dailyNoteFile - a TFile that holds the Daily Note File
	 * @returns Promise - true if it succeeded, false if it failed
	 */
	async fleshOutDailyNoteAutomatedFields(dateToUse: Moment, dailyNoteFile: TFile): Promise<Boolean> {

		// Sanity checking
		if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": fleshOutDailyNoteAutomatedFields() - Entered"); }
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
			if (this.settings.debugLevel >= 100) { console.log(this.manifest.name + ": fleshOutDailyNoteAutomatedFields() - Replacing Z2K's Automated Fields"); }
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

// ======================================================================================================
// Z2KLogCreatorSettingTab Settings Tab Class
// ======================================================================================================
// 
class Z2KLogCreatorSettingTab extends PluginSettingTab {
	plugin: Z2KLogCreatorPlugin;

	constructor(app: App, plugin: Z2KLogCreatorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		// Main Settings
		// ----------------------------------------------------------------------------------------------
		containerEl.createEl('h2', {text: 'Main Settings'});
		new Setting(containerEl)
			.setName('Install Ribbon Button')
			.setDesc('Installs a ribbon button')
			.setDisabled(this.plugin.settings.useRibbonButton)
			.addToggle(cb => cb.onChange(value => {
                this.plugin.settings.useRibbonButton = value;
                this.plugin.saveSettings();				
			}).setValue(this.plugin.settings.useRibbonButton))

		new Setting(containerEl)
			.setName('Create Daily Log on startup')
			.setDesc('Creates the Daily Log (if not already done) upon application startup')
			.setDisabled(this.plugin.settings.createLogOnStartup)
			.addToggle(cb => cb.onChange(value => {
                this.plugin.settings.createLogOnStartup = value;
                this.plugin.saveSettings();				
			}).setValue(this.plugin.settings.createLogOnStartup))


		// Advanced Settings
		// ----------------------------------------------------------------------------------------------
		containerEl.createEl('h2', {text: 'Advanced Settings'});
		// TODO: Does saveSettings need to be await?
		new Setting(containerEl)
			.setName('Validate Z2K Consistency for Daily Note plugin')
			.setDesc('Validate that the Daily Note plugin settings are consistent with a Z2K configuration')
			.setDisabled(this.plugin.settings.checkForZ2KDailyNoteSettingsConsistency)
			.addToggle(cb => cb.onChange(value => {
                this.plugin.settings.checkForZ2KDailyNoteSettingsConsistency = value;
                this.plugin.saveSettings();				
			}).setValue(this.plugin.settings.checkForZ2KDailyNoteSettingsConsistency))

		new Setting(containerEl)
			.setName("Debug Level (integer)")
			.addText(cb => cb.onChange(value => {
				this.plugin.settings.debugLevel = +value;
				this.plugin.saveSettings();
			}).setValue(this.plugin.settings.debugLevel.toString()));

	}
}

# Z2K - Log Creator plugin

## Overview
This [Obsidian](https//obsidian.md) plugin creates a daily notes file through a variety of means. It behaves similar to the core "Daily notes" plugin, but extends it with several new features.

Key features:
- Includes a number of methods by which a daily note/log file can be created automatically each day
- Support for creating log files other than for the current day
- Support for a wider variety of automated {{field}} names


*Aside: While it is intended for use as part of the larger [Z2K](https://z2k.dev) System, it can be used in ordinary Obsidian vaults as well. In the Z2k System, the "daily note" is called the "daily log", and thus this documentation uses "daily log" name instead.*


# Why use this plugin instead of the core "Daily notes" plugin?

## **Automated Log Creation**
Many people use a daily note to not just hold informational notes, but also data logging for their daily lives. For instance, some Obsidian users use the daily note/log to hold [Quantified Self](https://en.wikipedia.org/wiki/Quantified_self) data from their phones, smart watches, the web, and their custom sensors. This data can come from a variety of external apps at any time. The Z2K System itself incorporates data logging into its process.

In order for data logging to work, it is useful to have each day's log file to be ready for use at the start of the day, perhaps before you have even had the chance to load Obsidian directly. For instance, if you are logging the weather or your sleep time into your log file automatically in the morning, you'll need the daily log file to be already created and ready to receive the data the moment you wake up. 

This plugin allows exactly for that usage model by providing several failsafe methods that can be used together to ensure that the log file is ready to received automated data, even before you start the day.

The plugin supports the following methods for creating the daily log file are:
- Automatically upon Obsidian startup
- Use the Obsidian command interface (e.g. assigned command to a hotkey)
- Use the plugin's ribbon button
- Set the plugin to automatically create the log file at a given time
- Use the plugin's URI interface to trigger the log creation through an external application (e.g. cron job, Task Scheduler, iOS Shortcuts)

## **Other Features**
Even if you do not need the automated creation feature, the plugin still has several additional features:
- Supports additional premade {{fields}} for autoreplacement (e.g. timestamp, dayOfWeek, weekNum)
- Supports the ability to create daily log files for other days besides today
- Future: Supports a cutoff time for those that work late at night


This plugin was created due to a need for an automated way to create the daily log on set time schedule. If you want to make sure that the daily log has been created every morning, you can use this plugin to force the log creation at a specific time. This is crucial for applications in which the log file is being used to receive data from outside of the Obsidian environment (e.g. quantified self, iOS shortcuts, web data sources).


# Daily Notes Configuration
To minimize configuration complexity, this plugin uses the settings specified in the "Daily notes" core plugin settings:

- Daily Note naming format
- Daily Note vault location
- Daily Note template vault location

Thus, you will need to have the "Daily notes" core plugin still enabled and configured to run this plugin. 

**IMPORTANT NOTE:** It is important to *disable* the "Open daily note on startup" option inside the Daily notes core plugin settings page, otherwise this plugin will create the daily note first, preventing the Log Creator plugin from working.



# More Details
More details on the plugin configuration and examples can be found on the plugin's wiki pages.

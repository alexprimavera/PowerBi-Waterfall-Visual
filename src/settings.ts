"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class ColorSettingsCardSettings extends FormattingSettingsCard {
    positiveColor = new formattingSettings.ColorPicker({
        name: "positiveColor",
        displayName: "Positive Color",
        value: { value: "#2E8B57" }
    });

    negativeColor = new formattingSettings.ColorPicker({
        name: "negativeColor", 
        displayName: "Negative Color",
        value: { value: "#DC143C" }
    });

    totalColor = new formattingSettings.ColorPicker({
        name: "totalColor",
        displayName: "Total Color", 
        value: { value: "#4682B4" }
    });

    name: string = "colorSettings";
    displayName: string = "Colors";
    slices: Array<FormattingSettingsSlice> = [this.positiveColor, this.negativeColor, this.totalColor];
}

class DisplaySettingsCardSettings extends FormattingSettingsCard {
    showTotal = new formattingSettings.ToggleSwitch({
        name: "showTotal",
        displayName: "Show Total",
        value: true
    });

    name: string = "displaySettings";
    displayName: string = "Display Options";
    slices: Array<FormattingSettingsSlice> = [this.showTotal];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    colorSettings = new ColorSettingsCardSettings();
    displaySettings = new DisplaySettingsCardSettings();
    cards = [this.colorSettings, this.displaySettings];
}
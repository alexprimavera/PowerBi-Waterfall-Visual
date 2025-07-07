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

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    colorSettings = new ColorSettingsCardSettings();
    cards = [this.colorSettings];
}
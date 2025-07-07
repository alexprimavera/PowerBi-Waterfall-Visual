import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private updateCount;
    private formattingSettings;
    private formattingSettingsService;
    private plotlyDiv;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private createWaterfallChart;
    private processWaterfallData;
    private groupDataByCategoryAndBreakdown;
    private createPlotlyTraces;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}

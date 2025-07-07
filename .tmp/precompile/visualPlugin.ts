import { Visual } from "../../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];
var waterfallStartD2BF53E768064D19AD9FB499E5BCD67A_DEBUG: IVisualPlugin = {
    name: 'waterfallStartD2BF53E768064D19AD9FB499E5BCD67A_DEBUG',
    displayName: 'waterfallStart',
    class: 'Visual',
    apiVersion: '5.3.0',
    create: (options?: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (<any>globalThis).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["waterfallStartD2BF53E768064D19AD9FB499E5BCD67A_DEBUG"] = waterfallStartD2BF53E768064D19AD9FB499E5BCD67A_DEBUG;
}
export default waterfallStartD2BF53E768064D19AD9FB499E5BCD67A_DEBUG;
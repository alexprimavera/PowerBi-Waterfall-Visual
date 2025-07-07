/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import * as Plotly from 'plotly.js-dist-min';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

interface WaterfallDataPoint {
    category: string;
    breakdown: string;
    value: number;
    cumulativeValue: number;
    isTotal: boolean;
    isStart: boolean;
    isSubtotal: boolean;
    displayLabel: string;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private plotlyDiv: HTMLDivElement;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.updateCount = 0;
        
        if (document) {
            // Create Plotly container instead of the paragraph
            this.plotlyDiv = document.createElement('div');
            this.plotlyDiv.style.width = '100%';
            this.plotlyDiv.style.height = '100%';
            this.plotlyDiv.id = 'plotly-chart';
            this.target.appendChild(this.plotlyDiv);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);
        console.log('Visual update', options);
        this.updateCount++;
        
        const dataView = options.dataViews[0];
        if (!dataView || !dataView.categorical) {
            // Show a message when no data
            this.plotlyDiv.innerHTML = '<div style="text-align:center; padding:20px;">Please add Category and Value fields (Breakdown is optional)</div>';
            return;
        }

        this.createWaterfallChart(dataView);
    }

    private createWaterfallChart(dataView: any) {
        const categorical = dataView.categorical;
        const categories = categorical.categories;
        const values = categorical.values;

        if (!categories || !values || values.length === 0) {
            this.plotlyDiv.innerHTML = '<div style="text-align:center; padding:20px;">Please add Category and Value fields (Breakdown is optional)</div>';
            return;
        }

        // Get settings with defaults
        const positiveColor = this.formattingSettings.colorSettings?.positiveColor?.value?.value || '#2E8B57';
        const negativeColor = this.formattingSettings.colorSettings?.negativeColor?.value?.value || '#DC143C';
        const totalColor = this.formattingSettings.colorSettings?.totalColor?.value?.value || '#4682B4';
        const showTotal = this.formattingSettings.displaySettings?.showTotal?.value ?? true;

        // Process the data to create waterfall data points
        const waterfallData = this.processWaterfallData(categories, values, showTotal);

        if (waterfallData.length === 0) {
            this.plotlyDiv.innerHTML = '<div style="text-align:center; padding:20px;">No data to display</div>';
            return;
        }

        // Create Plotly traces for the waterfall chart
        const traces = this.createPlotlyTraces(waterfallData, positiveColor, negativeColor, totalColor);

        const layout = {
            title: 'Waterfall Chart with Category Subtotals',
            xaxis: { 
                title: 'Categories & Breakdowns',
                tickangle: -45
            },
            yaxis: { title: 'Values' },
            showlegend: false,
            barmode: 'stack',
            margin: { t: 50, l: 50, r: 50, b: 150 }
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        try {
            Plotly.newPlot(this.plotlyDiv, traces, layout, config);
        } catch (error) {
            console.error('Error creating chart:', error);
            this.plotlyDiv.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Error creating chart. Check console for details.</div>';
        }
    }

    private processWaterfallData(categories: any, values: any, showTotal: boolean): WaterfallDataPoint[] {
        const dataPoints: WaterfallDataPoint[] = [];
        
        console.log('Processing waterfall data:', { categories, values });
        
        // Find start value and main values
        let startValue = 0;
        let mainValues = null;
        
        // Look for start value and main values in the values array
        for (let i = 0; i < values.length; i++) {
            if (values[i].source && values[i].source.roles && values[i].source.roles.startValue) {
                startValue = values[i].values[0] || 0;
                console.log('Found start value in data:', startValue);
            }
            if (values[i].source && values[i].source.roles && values[i].source.roles.value) {
                mainValues = values[i];
                console.log('Found main values:', mainValues);
            }
        }

        if (!mainValues) {
            console.warn('No main values found');
            return dataPoints;
        }

        // Extract category and breakdown data
        let categoryData = null;
        let breakdownData = null;
        
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].source && categories[i].source.roles && categories[i].source.roles.category) {
                categoryData = categories[i];
            }
            if (categories[i].source && categories[i].source.roles && categories[i].source.roles.breakdown) {
                breakdownData = categories[i];
            }
        }

        if (!categoryData) {
            console.warn('No category data found');
            return dataPoints;
        }

        let runningTotal = startValue;

        // Add start value
        dataPoints.push({
            category: 'Start',
            breakdown: '',
            value: startValue,
            cumulativeValue: startValue,
            isTotal: false,
            isStart: true,
            isSubtotal: false,
            displayLabel: 'Start'
        });

        // Group data by category
        const groupedData = this.groupDataByCategoryAndBreakdown(categoryData, breakdownData, mainValues);
        
        // Process each category group
        for (const categoryName of Object.keys(groupedData)) {
            const categoryItems = groupedData[categoryName];
            let categoryTotal = 0;

            // Add breakdown items within this category
            for (const item of categoryItems) {
                runningTotal += item.value;
                categoryTotal += item.value;
                
                const displayLabel = breakdownData && item.breakdown ? 
                    `${categoryName} - ${item.breakdown}` : 
                    categoryName;

                dataPoints.push({
                    category: categoryName,
                    breakdown: item.breakdown || '',
                    value: item.value,
                    cumulativeValue: runningTotal,
                    isTotal: false,
                    isStart: false,
                    isSubtotal: false,
                    displayLabel: displayLabel
                });
            }

            // Add subtotal for this category (only if there are multiple breakdown items)
            if (categoryItems.length > 1 && breakdownData) {
                dataPoints.push({
                    category: categoryName,
                    breakdown: '',
                    value: categoryTotal,
                    cumulativeValue: runningTotal,
                    isTotal: false,
                    isStart: false,
                    isSubtotal: true,
                    displayLabel: `${categoryName} Subtotal`
                });
            }
        }

        // Add total (only if showTotal is enabled)
        if (showTotal) {
            dataPoints.push({
                category: 'Total',
                breakdown: '',
                value: runningTotal,
                cumulativeValue: runningTotal,
                isTotal: true,
                isStart: false,
                isSubtotal: false,
                displayLabel: 'Total'
            });
        }

        console.log('Final waterfall dataPoints:', dataPoints);
        return dataPoints;
    }

    private groupDataByCategoryAndBreakdown(categoryData: any, breakdownData: any, mainValues: any): { [key: string]: Array<{ breakdown: string, value: number }> } {
        const grouped: { [key: string]: Array<{ breakdown: string, value: number }> } = {};

        for (let i = 0; i < categoryData.values.length; i++) {
            const category = categoryData.values[i] || `Category ${i+1}`;
            const breakdown = breakdownData ? (breakdownData.values[i] || '') : '';
            const value = mainValues.values[i] as number || 0;

            if (!grouped[category]) {
                grouped[category] = [];
            }

            grouped[category].push({
                breakdown: breakdown,
                value: value
            });
        }

        console.log('Grouped data:', grouped);
        return grouped;
    }

    private createPlotlyTraces(dataPoints: WaterfallDataPoint[], positiveColor: string, negativeColor: string, totalColor: string): any[] {
        const traces = [];

        for (let i = 0; i < dataPoints.length; i++) {
            const point = dataPoints[i];
            let color: string;
            let base: number = 0;
            let barValue: number = point.value;

            if (point.isStart || point.isTotal) {
                // Start and total bars go from 0 to full value
                color = totalColor;
                base = 0;
                barValue = point.value;
            } else if (point.isSubtotal) {
                // Subtotal bars (lighter version of total color)
                color = totalColor;
                base = 0;
                barValue = point.cumulativeValue;
            } else {
                // Intermediate bars show the change
                color = point.value >= 0 ? positiveColor : negativeColor;
                const previousCumulative = i > 0 ? dataPoints[i-1].cumulativeValue - point.value : 0;
                
                if (point.value >= 0) {
                    // Positive change: bar starts at previous cumulative
                    base = previousCumulative;
                    barValue = point.value;
                } else {
                    // Negative change: bar goes down from current cumulative
                    base = point.cumulativeValue;
                    barValue = -point.value; // Plot as positive height but visually negative
                }
            }

            const displayLabel = point.displayLabel;
            const textValue = point.isStart || point.isTotal || point.isSubtotal ? 
                point.cumulativeValue.toFixed(1) : 
                (point.value >= 0 ? `+${point.value.toFixed(1)}` : point.value.toFixed(1));

            traces.push({
                x: [displayLabel],
                y: [barValue],
                base: [base],
                type: 'bar',
                marker: { 
                    color: color,
                    opacity: point.isSubtotal ? 0.7 : 1.0
                },
                name: point.displayLabel,
                text: [textValue],
                textposition: 'outside',
                hovertemplate: `<b>${point.displayLabel}</b><br>` +
                              `Value: ${point.value.toFixed(2)}<br>` +
                              `Cumulative: ${point.cumulativeValue.toFixed(2)}<br>` +
                              (point.breakdown ? `Breakdown: ${point.breakdown}<br>` : '') +
                              '<extra></extra>'
            });
        }

        return traces;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
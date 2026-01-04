/**
 * Office.js 类型声明
 * 这些类型在运行时由 Office.js 库提供
 */

declare namespace Office {
  const context: Context;
  
  interface Context {
    host: HostType;
    platform: PlatformType;
    document: Document;
  }
  
  enum HostType {
    Word = 'Word',
    Excel = 'Excel',
    PowerPoint = 'PowerPoint',
    Outlook = 'Outlook',
    OneNote = 'OneNote',
    Project = 'Project',
    Access = 'Access',
  }
  
  enum PlatformType {
    PC = 'PC',
    OfficeOnline = 'OfficeOnline',
    Mac = 'Mac',
    iOS = 'iOS',
    Android = 'Android',
    Universal = 'Universal',
  }
  
  interface Document {
    url: string;
  }
  
  function onReady(callback: (info: { host: HostType; platform: PlatformType }) => void): void;
}

declare namespace Excel {
  function run<T>(callback: (context: RequestContext) => Promise<T>): Promise<T>;
  
  interface RequestContext {
    workbook: Workbook;
    sync(): Promise<void>;
  }
  
  interface Workbook {
    worksheets: WorksheetCollection;
    names: NamedItemCollection;
    tables: TableCollection;
  }
  
  interface WorksheetCollection {
    items: Worksheet[];
    add(name?: string): Worksheet;
    getItem(key: string): Worksheet;
    getActiveWorksheet(): Worksheet;
    load(propertyNames?: string): void;
  }
  
  interface Worksheet {
    name: string;
    id: string;
    charts: ChartCollection;
    tables: TableCollection;
    activate(): void;
    delete(): void;
    getRange(address?: string): Range;
    getRangeByIndexes(startRow: number, startColumn: number, rowCount: number, columnCount: number): Range;
    getUsedRange(valuesOnly?: boolean): Range;
    load(propertyNames?: string): void;
  }
  
  interface Range {
    values: unknown[][];
    text: string[][];
    formulas: unknown[][];
    address: string;
    rowCount: number;
    columnCount: number;
    format: RangeFormat;
    merge(across?: boolean): void;
    unmerge(): void;
    clear(applyTo?: ClearApplyTo): void;
    getEntireColumn(): Range;
    getEntireRow(): Range;
    load(propertyNames?: string): void;
  }
  
  interface RangeFormat {
    fill: RangeFill;
    font: RangeFont;
    borders: RangeBorderCollection;
    horizontalAlignment: HorizontalAlignment;
    verticalAlignment: VerticalAlignment;
    wrapText: boolean;
    columnWidth: number;
    rowHeight: number;
    autofitColumns(): void;
    autofitRows(): void;
  }
  
  interface RangeFill {
    color: string;
    clear(): void;
  }
  
  interface RangeFont {
    name: string;
    size: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: RangeUnderlineStyle;
  }
  
  interface RangeBorderCollection {
    getItem(index: BorderIndex): RangeBorder;
  }
  
  interface RangeBorder {
    style: BorderLineStyle;
    color: string;
    weight: BorderWeight;
  }
  
  interface ChartCollection {
    items: Chart[];
    add(type: ChartType, sourceData: Range, seriesBy?: ChartSeriesBy): Chart;
    getItem(name: string): Chart;
    load(propertyNames?: string): void;
  }
  
  interface Chart {
    name: string;
    title: ChartTitle;
    legend: ChartLegend;
    axes: ChartAxes;
    series: ChartSeriesCollection;
    left: number;
    top: number;
    width: number;
    height: number;
    delete(): void;
    load(propertyNames?: string): void;
  }
  
  interface ChartTitle {
    text: string;
    visible: boolean;
  }
  
  interface ChartLegend {
    visible: boolean;
    position: ChartLegendPosition;
  }
  
  interface ChartAxes {
    categoryAxis: ChartAxis;
    valueAxis: ChartAxis;
  }
  
  interface ChartAxis {
    title: ChartAxisTitle;
    minimum: number;
    maximum: number;
  }
  
  interface ChartAxisTitle {
    text: string;
    visible: boolean;
  }
  
  interface ChartSeriesCollection {
    items: ChartSeries[];
    getItemAt(index: number): ChartSeries;
    load(propertyNames?: string): void;
  }
  
  interface ChartSeries {
    name: string;
    format: ChartSeriesFormat;
  }
  
  interface ChartSeriesFormat {
    fill: ChartFill;
  }
  
  interface ChartFill {
    setSolidColor(color: string): void;
  }
  
  interface TableCollection {
    items: Table[];
    add(address: Range | string, hasHeaders: boolean): Table;
    getItem(key: string): Table;
    load(propertyNames?: string): void;
  }
  
  interface Table {
    name: string;
    id: number;
    columns: TableColumnCollection;
    rows: TableRowCollection;
    delete(): void;
    load(propertyNames?: string): void;
  }
  
  interface TableColumnCollection {
    items: TableColumn[];
    add(index?: number, values?: unknown[][], name?: string): TableColumn;
    getItem(key: number | string): TableColumn;
    load(propertyNames?: string): void;
  }
  
  interface TableColumn {
    name: string;
    index: number;
  }
  
  interface TableRowCollection {
    items: TableRow[];
    add(index?: number, values?: unknown[][]): TableRow;
    load(propertyNames?: string): void;
  }
  
  interface TableRow {
    index: number;
    values: unknown[][];
  }
  
  interface NamedItemCollection {
    items: NamedItem[];
    add(name: string, reference: Range | string, comment?: string): NamedItem;
    getItem(name: string): NamedItem;
    load(propertyNames?: string): void;
  }
  
  interface NamedItem {
    name: string;
    value: unknown;
    type: NamedItemType;
  }
  
  enum ChartType {
    invalid = 'Invalid',
    columnClustered = 'ColumnClustered',
    columnStacked = 'ColumnStacked',
    columnStacked100 = 'ColumnStacked100',
    barClustered = 'BarClustered',
    barStacked = 'BarStacked',
    barStacked100 = 'BarStacked100',
    line = 'Line',
    lineStacked = 'LineStacked',
    lineStacked100 = 'LineStacked100',
    lineMarkers = 'LineMarkers',
    lineMarkersStacked = 'LineMarkersStacked',
    lineMarkersStacked100 = 'LineMarkersStacked100',
    pie = 'Pie',
    pieOfPie = 'PieOfPie',
    pieExploded = 'PieExploded',
    doughnut = 'Doughnut',
    doughnutExploded = 'DoughnutExploded',
    area = 'Area',
    areaStacked = 'AreaStacked',
    areaStacked100 = 'AreaStacked100',
    scatter = 'XYScatter',
    scatterLines = 'XYScatterLines',
    scatterLinesNoMarkers = 'XYScatterLinesNoMarkers',
    scatterSmooth = 'XYScatterSmooth',
    scatterSmoothNoMarkers = 'XYScatterSmoothNoMarkers',
    radar = 'Radar',
    radarMarkers = 'RadarMarkers',
    radarFilled = 'RadarFilled',
  }
  
  enum ChartSeriesBy {
    auto = 'Auto',
    columns = 'Columns',
    rows = 'Rows',
  }
  
  enum ChartLegendPosition {
    invalid = 'Invalid',
    top = 'Top',
    bottom = 'Bottom',
    left = 'Left',
    right = 'Right',
    corner = 'Corner',
    custom = 'Custom',
  }
  
  enum HorizontalAlignment {
    general = 'General',
    left = 'Left',
    center = 'Center',
    right = 'Right',
    fill = 'Fill',
    justify = 'Justify',
    centerAcrossSelection = 'CenterAcrossSelection',
    distributed = 'Distributed',
  }
  
  enum VerticalAlignment {
    top = 'Top',
    center = 'Center',
    bottom = 'Bottom',
    justify = 'Justify',
    distributed = 'Distributed',
  }
  
  enum BorderIndex {
    edgeTop = 'EdgeTop',
    edgeBottom = 'EdgeBottom',
    edgeLeft = 'EdgeLeft',
    edgeRight = 'EdgeRight',
    insideVertical = 'InsideVertical',
    insideHorizontal = 'InsideHorizontal',
    diagonalDown = 'DiagonalDown',
    diagonalUp = 'DiagonalUp',
  }
  
  enum BorderLineStyle {
    none = 'None',
    continuous = 'Continuous',
    dash = 'Dash',
    dashDot = 'DashDot',
    dashDotDot = 'DashDotDot',
    dot = 'Dot',
    double = 'Double',
    slantDashDot = 'SlantDashDot',
    thin = 'Thin',
    medium = 'Medium',
    thick = 'Thick',
  }
  
  enum BorderWeight {
    hairline = 'Hairline',
    thin = 'Thin',
    medium = 'Medium',
    thick = 'Thick',
  }
  
  enum RangeUnderlineStyle {
    none = 'None',
    single = 'Single',
    double = 'Double',
    singleAccountant = 'SingleAccountant',
    doubleAccountant = 'DoubleAccountant',
  }
  
  enum ClearApplyTo {
    all = 'All',
    formats = 'Formats',
    contents = 'Contents',
    hyperlinks = 'Hyperlinks',
    removeHyperlinks = 'RemoveHyperlinks',
  }
  
  enum NamedItemType {
    string = 'String',
    integer = 'Integer',
    double = 'Double',
    boolean = 'Boolean',
    range = 'Range',
    error = 'Error',
    array = 'Array',
  }
}

declare namespace Word {
  function run<T>(callback: (context: RequestContext) => Promise<T>): Promise<T>;
  
  interface RequestContext {
    document: Document;
    sync(): Promise<void>;
  }
  
  interface Document {
    body: Body;
    sections: SectionCollection;
    contentControls: ContentControlCollection;
    save(): void;
    load(propertyNames?: string): void;
  }
  
  interface Body {
    paragraphs: ParagraphCollection;
    tables: TableCollection;
    text: string;
    font: Font;
    insertText(text: string, insertLocation: InsertLocation): Range;
    insertParagraph(paragraphText: string, insertLocation: InsertLocation): Paragraph;
    insertTable(rowCount: number, columnCount: number, insertLocation: InsertLocation, values?: string[][]): Table;
    clear(): void;
    load(propertyNames?: string): void;
  }
  
  interface Range {
    text: string;
    font: Font;
    paragraphFormat: ParagraphFormat;
    insertText(text: string, insertLocation: InsertLocation): Range;
    insertParagraph(paragraphText: string, insertLocation: InsertLocation): Paragraph;
    load(propertyNames?: string): void;
  }
  
  interface Font {
    name: string;
    size: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: UnderlineType;
  }
  
  interface ParagraphFormat {
    alignment: Alignment;
    lineSpacing: number;
    firstLineIndent: number;
    leftIndent: number;
    rightIndent: number;
    spaceAfter: number;
    spaceBefore: number;
  }
  
  interface ParagraphCollection {
    items: Paragraph[];
    getFirst(): Paragraph;
    getLast(): Paragraph;
    load(propertyNames?: string): void;
  }
  
  interface Paragraph {
    text: string;
    font: Font;
    paragraphFormat: ParagraphFormat;
    insertText(text: string, insertLocation: InsertLocation): Range;
    insertParagraph(paragraphText: string, insertLocation: InsertLocation): Paragraph;
    insertBreak(breakType: BreakType, insertLocation: InsertLocation): void;
    delete(): void;
    load(propertyNames?: string): void;
  }
  
  interface TableCollection {
    items: Table[];
    getFirst(): Table;
    load(propertyNames?: string): void;
  }
  
  interface Table {
    rows: TableRowCollection;
    headerRowCount: number;
    values: string[][];
    font: Font;
    addRows(insertLocation: InsertLocation, rowCount: number, values?: string[][]): TableRowCollection;
    addColumns(insertLocation: InsertLocation, columnCount: number, values?: string[][]): void;
    delete(): void;
    load(propertyNames?: string): void;
  }
  
  interface TableRowCollection {
    items: TableRow[];
    getFirst(): TableRow;
    load(propertyNames?: string): void;
  }
  
  interface TableRow {
    cells: TableCellCollection;
    values: string[][];
    font: Font;
    load(propertyNames?: string): void;
  }
  
  interface TableCellCollection {
    items: TableCell[];
    getFirst(): TableCell;
    load(propertyNames?: string): void;
  }
  
  interface TableCell {
    value: string;
    body: Body;
    load(propertyNames?: string): void;
  }
  
  interface SectionCollection {
    items: Section[];
    getFirst(): Section;
    load(propertyNames?: string): void;
  }
  
  interface Section {
    body: Body;
    load(propertyNames?: string): void;
  }
  
  interface ContentControlCollection {
    items: ContentControl[];
    getByTitle(title: string): ContentControlCollection;
    load(propertyNames?: string): void;
  }
  
  interface ContentControl {
    title: string;
    text: string;
    insertText(text: string, insertLocation: InsertLocation): Range;
    load(propertyNames?: string): void;
  }
  
  enum InsertLocation {
    before = 'Before',
    after = 'After',
    start = 'Start',
    end = 'End',
    replace = 'Replace',
  }
  
  enum Alignment {
    mixed = 'Mixed',
    unknown = 'Unknown',
    left = 'Left',
    centered = 'Centered',
    right = 'Right',
    justified = 'Justified',
  }
  
  enum UnderlineType {
    mixed = 'Mixed',
    none = 'None',
    single = 'Single',
    word = 'Word',
    double = 'Double',
    thick = 'Thick',
    dotted = 'Dotted',
    dottedHeavy = 'DottedHeavy',
    dashLine = 'DashLine',
    dashLineHeavy = 'DashLineHeavy',
    dashLineLong = 'DashLineLong',
    dashLineLongHeavy = 'DashLineLongHeavy',
    dotDashLine = 'DotDashLine',
    dotDashLineHeavy = 'DotDashLineHeavy',
    twoDotDashLine = 'TwoDotDashLine',
    twoDotDashLineHeavy = 'TwoDotDashLineHeavy',
    wave = 'Wave',
    waveHeavy = 'WaveHeavy',
    waveDouble = 'WaveDouble',
  }
  
  enum BreakType {
    page = 'Page',
    next = 'Next',
    sectionContinuous = 'SectionContinuous',
    sectionEven = 'SectionEven',
    sectionOdd = 'SectionOdd',
    line = 'Line',
  }
}
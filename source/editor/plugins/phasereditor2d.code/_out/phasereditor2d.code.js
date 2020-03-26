var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var controls = colibri.ui.controls;
        code.ICON_SYMBOL_CLASS = "symbol-class";
        code.ICON_SYMBOL_CONSTANT = "symbol-constant";
        code.ICON_SYMBOL_FIELD = "symbol-field";
        code.ICON_SYMBOL_INTERFACE = "symbol-interface";
        code.ICON_SYMBOL_METHOD = "symbol-method";
        code.ICON_SYMBOL_NAMESPACE = "symbol-namespace";
        code.ICON_SYMBOL_PROPERTY = "symbol-property";
        code.ICON_SYMBOL_VARIABLE = "symbol-variable";
        class CodePlugin extends colibri.Plugin {
            constructor() {
                super("phasereditor2d.code");
            }
            static getInstance() {
                if (!this._instance) {
                    this._instance = new CodePlugin();
                }
                return this._instance;
            }
            registerExtensions(reg) {
                // icons loader
                reg.addExtension(colibri.ui.ide.IconLoaderExtension.withPluginFiles(this, [
                    code.ICON_SYMBOL_CLASS,
                    code.ICON_SYMBOL_CONSTANT,
                    code.ICON_SYMBOL_FIELD,
                    code.ICON_SYMBOL_INTERFACE,
                    code.ICON_SYMBOL_METHOD,
                    code.ICON_SYMBOL_NAMESPACE,
                    code.ICON_SYMBOL_PROPERTY,
                    code.ICON_SYMBOL_VARIABLE
                ]));
                // editors
                reg.addExtension(new colibri.ui.ide.EditorExtension([
                    code.ui.editors.JavaScriptEditor.getFactory(),
                    code.ui.editors.TypeScriptEditor.getFactory(),
                    code.ui.editors.HTMLEditor.getFactory(),
                    code.ui.editors.CSSEditor.getFactory(),
                    code.ui.editors.JSONEditor.getFactory(),
                    code.ui.editors.XMLEditor.getFactory(),
                    code.ui.editors.TextEditor.getFactory(),
                ]));
                // extra libs loader
                if (this.isAdvancedJSEditor()) {
                    console.log("CodePlugin: Enable advanced JavaScript coding tools.");
                    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
                    reg.addExtension(new code.ui.PreloadExtraLibsExtension());
                    reg.addExtension(new code.ui.PreloadModelsExtension());
                }
            }
            isAdvancedJSEditor() {
                return phasereditor2d.ide.IDEPlugin.getInstance().isAdvancedJSEditor();
            }
            async starting() {
                this._modelManager = new code.ui.ModelManager();
                // theme
                monaco.editor.defineTheme("vs", {
                    inherit: true,
                    base: "vs",
                    rules: [
                        {
                            background: "e2e2e2"
                        }
                    ],
                    colors: {
                        "editor.background": "#eaeaea",
                        "editor.lineHighlightBackground": "#bad4ee88"
                    }
                });
                monaco.editor.defineTheme("vs-dark", {
                    inherit: true,
                    base: "vs-dark",
                    rules: [
                        {
                            background: "222222"
                        }
                    ],
                    colors: {
                        "editor.background": "#2e2e2e",
                        "editor.lineHighlightBackground": "#3e3e3e88"
                    }
                });
                window.addEventListener(controls.EVENT_THEME_CHANGED, e => {
                    let monacoTheme = "vs";
                    if (controls.Controls.getTheme().dark) {
                        monacoTheme = "vs-dark";
                    }
                    monaco.editor.setTheme(monacoTheme);
                });
            }
        }
        code.CodePlugin = CodePlugin;
        colibri.Platform.addPlugin(CodePlugin.getInstance());
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            class ModelManager {
                constructor() {
                    const utils = colibri.ui.ide.FileUtils;
                    const storage = colibri.ui.ide.Workbench.getWorkbench().getFileStorage();
                    storage.addFirstChangeListener(async (e) => {
                        const files = utils.getRoot().flatTree([], false);
                        const fileMap = new Map();
                        for (const file of files) {
                            fileMap.set(file.getFullName(), file);
                        }
                        // handle additions
                        for (const fileName of e.getAddRecords()) {
                            if (!fileName.endsWith(".js")) {
                                continue;
                            }
                            const file = fileMap.get(fileName);
                            const str = await utils.preloadAndGetFileString(file);
                            monaco.editor.createModel(str, "javascript", monaco.Uri.file(fileName));
                        }
                        // handle deletions
                        for (const fileName of e.getDeleteRecords()) {
                            if (!fileName.endsWith(".js")) {
                                continue;
                            }
                            const model = monaco.editor.getModel(monaco.Uri.file(fileName));
                            if (model) {
                                model.dispose();
                            }
                        }
                        // handle modifications
                        for (const fileName of e.getModifiedRecords()) {
                            if (!fileName.endsWith(".js")) {
                                continue;
                            }
                            const file = fileMap.get(fileName);
                            const content = await utils.preloadAndGetFileString(file);
                            const model = monaco.editor.getModel(monaco.Uri.file(fileName));
                            if (model.getValue() !== content) {
                                model.setValue(content);
                            }
                        }
                        // handle renames
                        for (const oldFileName of e.getRenameFromRecords()) {
                            if (!oldFileName.endsWith(".js")) {
                                continue;
                            }
                            const newFileName = e.getRenameTo(oldFileName);
                            const oldModel = monaco.editor.getModel(monaco.Uri.file(oldFileName));
                            monaco.editor.createModel(oldModel.getValue(), "javascript", monaco.Uri.file(newFileName));
                            oldModel.dispose();
                        }
                    });
                }
            }
            ui.ModelManager = ModelManager;
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            class PreloadExtraLibsExtension extends colibri.ui.ide.PreloadProjectResourcesExtension {
                async computeTotal() {
                    return this.getFiles().length;
                }
                getFiles() {
                    return colibri.ui.ide.FileUtils.getAllFiles()
                        .filter(file => file.getName().endsWith(".d.ts"));
                }
                async preload(monitor) {
                    const utils = colibri.ui.ide.FileUtils;
                    const files = this.getFiles();
                    for (const file of files) {
                        const content = await utils.preloadAndGetFileString(file);
                        if (content) {
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(content, file.getFullName());
                        }
                        monitor.step();
                    }
                }
            }
            ui.PreloadExtraLibsExtension = PreloadExtraLibsExtension;
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            class PreloadModelsExtension extends colibri.ui.ide.PreloadProjectResourcesExtension {
                async computeTotal() {
                    return this.getFiles().length;
                }
                getFiles() {
                    return colibri.ui.ide.FileUtils.getAllFiles()
                        .filter(file => file.getName().endsWith(".js"));
                }
                async preload(monitor) {
                    monaco.editor.getModels().forEach(model => model.dispose());
                    const utils = colibri.ui.ide.FileUtils;
                    const files = this.getFiles();
                    for (const file of files) {
                        const content = await utils.preloadAndGetFileString(file);
                        if (typeof content === "string") {
                            monaco.editor.createModel(content, "javascript", monaco.Uri.file(file.getFullName()));
                        }
                        monitor.step();
                    }
                }
            }
            ui.PreloadModelsExtension = PreloadModelsExtension;
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class MonacoEditor extends colibri.ui.ide.FileEditor {
                    constructor(id, language) {
                        super(id);
                        this.addClass("MonacoEditor");
                        this._language = language;
                        this._outlineProvider = new editors.outline.MonacoEditorOutlineProvider(this);
                    }
                    getMonacoEditor() {
                        return MonacoEditor._sharedEditor;
                    }
                    onPartClosed() {
                        if (super.onPartClosed()) {
                            if (this._model) {
                                this._viewState = MonacoEditor._sharedEditor.saveViewState();
                                this.disposeModel();
                            }
                            return true;
                        }
                        return false;
                    }
                    disposeModel() {
                        this.removeModelListeners();
                        this._model.dispose();
                        this._model = null;
                    }
                    removeModelListeners() {
                        if (this._modelDidChangeListener) {
                            this._modelDidChangeListener.dispose();
                        }
                    }
                    createPart() {
                        if (!MonacoEditor._sharedEditorContainer) {
                            const container = document.createElement("div");
                            container.classList.add("MonacoEditorContainer");
                            MonacoEditor._sharedEditorContainer = container;
                            MonacoEditor._sharedEditor = monaco.editor.create(container, {
                                scrollBeyondLastLine: true,
                                fontSize: 16
                            });
                        }
                        this.getElement().appendChild(MonacoEditor._sharedEditorContainer);
                        this.updateContent();
                    }
                    onPartDeactivated() {
                        super.onPartDeactivated();
                        this._viewState = MonacoEditor._sharedEditor.saveViewState();
                    }
                    onPartActivated() {
                        super.onPartActivated();
                        if (MonacoEditor._sharedEditorContainer) {
                            this.getElement().appendChild(MonacoEditor._sharedEditorContainer);
                            const editor = MonacoEditor._sharedEditor;
                            editor.setModel(this._model);
                            if (this._viewState) {
                                editor.restoreViewState(this._viewState);
                            }
                            setTimeout(() => {
                                editor.focus();
                            }, 1);
                        }
                    }
                    getTokensAtLine(position) {
                        const model = this._model;
                        const line = model.getLineContent(position.lineNumber);
                        const tokens = monaco.editor.tokenize(line, this._language);
                        let type = "unknown";
                        for (const token of tokens[0]) {
                            if (position.column >= token.offset) {
                                type = token.type;
                            }
                        }
                        return type;
                    }
                    async doSave() {
                        const content = this._model.getValue();
                        try {
                            await colibri.ui.ide.FileUtils.setFileString_async(this.getInput(), content);
                            this.setDirty(false);
                            this.refreshOutline();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    async updateContent() {
                        const file = this.getInput();
                        if (!file) {
                            return;
                        }
                        const editor = MonacoEditor._sharedEditor;
                        if (!editor) {
                            return;
                        }
                        const before = editor.saveViewState();
                        this._model = await this.createModel(file);
                        editor.restoreViewState(before);
                        this._modelDidChangeListener = this._model.onDidChangeContent(e => {
                            this.setDirty(true);
                        });
                        MonacoEditor._sharedEditor.setModel(this._model);
                        this.registerModelListeners(this._model);
                        this.setDirty(false);
                        this.refreshOutline();
                    }
                    async createModel(file) {
                        const content = await colibri.ui.ide.FileUtils.preloadAndGetFileString(file);
                        const model = monaco.editor.createModel(content, this._language, monaco.Uri.file(file.getFullName()));
                        return model;
                    }
                    registerModelListeners(model) {
                        this._modelLines = model.getLineCount();
                        model.onDidChangeContent(e => {
                            const count = model.getLineCount();
                            if (count !== this._modelLines) {
                                this.refreshOutline();
                                this._modelLines = count;
                            }
                        });
                    }
                    getEditorViewerProvider(key) {
                        switch (key) {
                            case phasereditor2d.outline.ui.views.OutlineView.EDITOR_VIEWER_PROVIDER_KEY:
                                return this._outlineProvider;
                        }
                        return null;
                    }
                    async refreshOutline() {
                        await this._outlineProvider.refresh();
                    }
                    layout() {
                        super.layout();
                        if (MonacoEditor._sharedEditor) {
                            MonacoEditor._sharedEditor.layout();
                        }
                    }
                    onEditorInputContentChanged() {
                        // handled by the ModelManager.
                    }
                }
                editors.MonacoEditor = MonacoEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class CSSEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.CSSEditor", "css");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_CSS, () => new CSSEditor()));
                    }
                    async requestOutlineItems() {
                        return [];
                    }
                }
                editors.CSSEditor = CSSEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class HTMLEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.HTMLEditor", "html");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_HTML, () => new HTMLEditor()));
                    }
                    async requestOutlineItems() {
                        return [];
                    }
                }
                editors.HTMLEditor = HTMLEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class JSONEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.JSONEditor", "json");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_JSON, () => new JSONEditor()));
                    }
                    async requestOutlineItems() {
                        return [];
                    }
                }
                editors.JSONEditor = JSONEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class JavaScriptEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.JavaScriptEditor", "javascript");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_JAVASCRIPT, () => new JavaScriptEditor()));
                    }
                    async createModel(file) {
                        if (code.CodePlugin.getInstance().isAdvancedJSEditor()) {
                            const content = await colibri.ui.ide.FileUtils.preloadAndGetFileString(file);
                            const uri = monaco.Uri.file(file.getFullName());
                            const model = monaco.editor.getModel(uri);
                            if (content !== model.getValue()) {
                                model.setValue(content);
                            }
                            return model;
                        }
                        else {
                            super.createModel(file);
                        }
                    }
                    onEditorFileNameChanged() {
                        const uri = monaco.Uri.file(this.getInput().getFullName());
                        this._model = monaco.editor.getModel(uri);
                        const editor = this.getMonacoEditor();
                        const state = editor.saveViewState();
                        editor.setModel(this._model);
                        editor.restoreViewState(state);
                    }
                    disposeModel() {
                        if (code.CodePlugin.getInstance().isAdvancedJSEditor()) {
                            // the model is disposed by the ModelsManager.
                            // but we should update it with the file content if the editor is dirty
                            if (this.isDirty()) {
                                console.log("update the model with the file content");
                                const content = colibri.ui.ide.FileUtils.getFileString(this.getInput());
                                const model = this.getMonacoEditor().getModel();
                                model.setValue(content);
                            }
                            this.removeModelListeners();
                        }
                        else {
                            super.disposeModel();
                        }
                    }
                    async requestOutlineItems() {
                        if (!this._worker) {
                            const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
                            this._worker = await getWorker();
                        }
                        const model = this.getMonacoEditor().getModel();
                        if (model) {
                            const items = await this._worker
                                .getNavigationBarItems(model.uri.toString());
                            return items;
                        }
                        return [];
                    }
                }
                editors.JavaScriptEditor = JavaScriptEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class TextEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.TextLEditor", "text");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_TEXT, () => new TextEditor()));
                    }
                    async requestOutlineItems() {
                        return [];
                    }
                }
                editors.TextEditor = TextEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class TypeScriptEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.TypeScriptEditor", "typescript");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_TYPESCRIPT, () => new TypeScriptEditor()));
                    }
                    async requestOutlineItems() {
                        if (!this._worker) {
                            const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
                            this._worker = await getWorker();
                        }
                        const items = await this._worker
                            .getNavigationBarItems(this.getMonacoEditor().getModel().uri.toString());
                        return items;
                    }
                }
                editors.TypeScriptEditor = TypeScriptEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
/// <reference path="./MonacoEditor.ts" />
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                class XMLEditor extends editors.MonacoEditor {
                    constructor() {
                        super("phasereditor2d.core.ui.editors.XMLEditor", "xml");
                    }
                    static getFactory() {
                        return this._factory
                            || (this._factory = new colibri.ui.ide.ContentTypeEditorFactory(phasereditor2d.webContentTypes.core.CONTENT_TYPE_XML, () => new XMLEditor()));
                    }
                    async requestOutlineItems() {
                        return [];
                    }
                }
                editors.XMLEditor = XMLEditor;
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                var outline;
                (function (outline) {
                    var controls = colibri.ui.controls;
                    class MonacoEditorOutlineProvider extends colibri.ui.ide.EditorViewerProvider {
                        constructor(editor) {
                            super();
                            this._editor = editor;
                            this._items = [];
                        }
                        getContentProvider() {
                            return new outline.MonacoOutlineContentProvider(this);
                        }
                        getLabelProvider() {
                            // tslint:disable-next-line:new-parens
                            return new class {
                                getLabel(obj) {
                                    return obj.text;
                                }
                            };
                        }
                        getCellRendererProvider() {
                            return new outline.MonacoOutlineCellRendererProvider();
                        }
                        getTreeViewerRenderer(viewer) {
                            return new controls.viewers.TreeViewerRenderer(viewer);
                        }
                        getPropertySectionProvider() {
                            return null;
                        }
                        getInput() {
                            return this._editor.getInput();
                        }
                        getItems() {
                            return this._items;
                        }
                        async preload() {
                            // nothing for now
                        }
                        async refresh() {
                            this._items = await this._editor.requestOutlineItems();
                            this.repaint();
                        }
                        getUndoManager() {
                            return this._editor.getUndoManager();
                        }
                    }
                    outline.MonacoEditorOutlineProvider = MonacoEditorOutlineProvider;
                })(outline = editors.outline || (editors.outline = {}));
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                var outline;
                (function (outline) {
                    var controls = colibri.ui.controls;
                    class MonacoOutlineCellRendererProvider {
                        getCellRenderer(obj) {
                            let name;
                            if (typeof obj.kind === "string") {
                                name = MonacoOutlineCellRendererProvider.map[obj.kind];
                            }
                            if (!name) {
                                name = code.ICON_SYMBOL_VARIABLE;
                            }
                            const img = code.CodePlugin.getInstance().getIcon(name);
                            return new controls.viewers.IconImageCellRenderer(img);
                        }
                        preload(args) {
                            return controls.Controls.resolveNothingLoaded();
                        }
                    }
                    MonacoOutlineCellRendererProvider.map = {
                        class: code.ICON_SYMBOL_CLASS,
                        const: code.ICON_SYMBOL_CONSTANT,
                        field: code.ICON_SYMBOL_FIELD,
                        interface: code.ICON_SYMBOL_INTERFACE,
                        method: code.ICON_SYMBOL_METHOD,
                        function: code.ICON_SYMBOL_METHOD,
                        constructor: code.ICON_SYMBOL_METHOD,
                        namespace: code.ICON_SYMBOL_NAMESPACE,
                        property: code.ICON_SYMBOL_PROPERTY,
                        variable: code.ICON_SYMBOL_VARIABLE,
                    };
                    outline.MonacoOutlineCellRendererProvider = MonacoOutlineCellRendererProvider;
                })(outline = editors.outline || (editors.outline = {}));
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
var phasereditor2d;
(function (phasereditor2d) {
    var code;
    (function (code) {
        var ui;
        (function (ui) {
            var editors;
            (function (editors) {
                var outline;
                (function (outline) {
                    class MonacoOutlineContentProvider {
                        constructor(provider) {
                            this._provider = provider;
                        }
                        getRoots(input) {
                            return this._provider.getItems();
                        }
                        getChildren(parent) {
                            if (parent.childItems) {
                                return parent.childItems;
                            }
                            return [];
                        }
                    }
                    outline.MonacoOutlineContentProvider = MonacoOutlineContentProvider;
                })(outline = editors.outline || (editors.outline = {}));
            })(editors = ui.editors || (ui.editors = {}));
        })(ui = code.ui || (code.ui = {}));
    })(code = phasereditor2d.code || (phasereditor2d.code = {}));
})(phasereditor2d || (phasereditor2d = {}));
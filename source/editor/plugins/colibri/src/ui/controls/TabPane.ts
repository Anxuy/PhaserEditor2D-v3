namespace colibri.ui.controls {

    class CloseIconManager {

        private _iconControl: controls.IconControl;
        private _icon: IImage;
        private _overIcon: IImage;

        constructor() {

            this._iconControl = new controls.IconControl();
            this._iconControl.getCanvas().classList.add("TabPaneLabelCloseIcon");

            this._iconControl.getCanvas().addEventListener("mouseenter", e => {

                this._iconControl.setIcon(this._overIcon);
            });

            this._iconControl.getCanvas().addEventListener("mouseleave", e => {

                this._iconControl.setIcon(this._icon);
            });
        }

        static setManager(element: HTMLElement, manager: CloseIconManager) {
            element["__CloseIconManager"] = manager;
        }

        static getManager(element: HTMLElement): CloseIconManager {
            return element["__CloseIconManager"];
        }

        setDefaultIcon(icon: IImage) {

            this._icon = icon;
            this._iconControl.setIcon(icon);
        }

        setOverIcon(icon: IImage) {

            this._overIcon = icon;
        }

        repaint() {

            this._iconControl.repaint();
        }

        getElement() {
            return this._iconControl.getCanvas();
        }
    }

    class TabIconManager {

        private _icon: IImage;
        private _canvas: HTMLCanvasElement;

        private constructor(canvas: HTMLCanvasElement, icon: IImage) {

            this._canvas = canvas;

            this._icon = icon;
        }

        static createElement(icon: IImage, size: number) {

            const canvas = document.createElement("canvas");
            canvas.classList.add("TabCloseIcon");

            const manager = new TabIconManager(canvas, icon);

            canvas["__TabIconManager"] = manager;

            manager.resize(size);

            return canvas;
        }

        resize(size: number) {

            size = Math.max(size, RENDER_ICON_SIZE);

            if (this._icon && this._icon.getWidth() === ICON_SIZE
                && this._icon.getHeight() === ICON_SIZE) {

                size = RENDER_ICON_SIZE;
            }

            this._canvas.width = this._canvas.height = size;
            this._canvas.style.width = this._canvas.style.height = size + "px";

            this.repaint();
        }

        static getManager(canvas: HTMLCanvasElement): TabIconManager {
            return canvas["__TabIconManager"];
        }

        setIcon(icon: IImage) {

            this._icon = icon;

            this.repaint();
        }

        repaint() {

            Controls.adjustCanvasDPI(this._canvas);

            const ctx = this._canvas.getContext("2d");

            ctx.imageSmoothingEnabled = false;

            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

            if (!this._icon) {

                return;
            }

            const w = this._icon.getWidth();
            const h = this._icon.getHeight();
            const canvasWidth = this._canvas.width / DEVICE_PIXEL_RATIO;
            const canvasHeight = this._canvas.height / DEVICE_PIXEL_RATIO;

            if (w === ICON_SIZE && h === ICON_SIZE) {

                // is a real, fixed size icon image

                this._icon.paint(
                    ctx,
                    (canvasWidth - RENDER_ICON_SIZE) / 2,
                    (canvasHeight - RENDER_ICON_SIZE) / 2,
                    RENDER_ICON_SIZE,
                    RENDER_ICON_SIZE,
                    false
                );

            } else {

                // is a scalable icon image

                this._icon.paint(ctx, 0, 0, canvasWidth, canvasHeight, true);
            }
        }
    }

    // export const EVENT_TAB_CLOSED = "tabClosed";
    // export const EVENT_TAB_SELECTED = "tabSelected";
    // export const EVENT_TAB_LABEL_RESIZED = "tabResized";

    export class TabPane extends Control {

        public eventTabClosed = new ListenerList();
        public eventTabSelected = new ListenerList();
        public eventTabLabelResized = new ListenerList();

        private _titleBarElement: HTMLElement;
        private _contentAreaElement: HTMLElement;
        private _iconSize: number;
        private static _selectedTimeCounter: number = 0;

        constructor(...classList: string[]) {
            super("div", "TabPane", ...classList);

            this._titleBarElement = document.createElement("div");
            this._titleBarElement.classList.add("TabPaneTitleBar");
            this.getElement().appendChild(this._titleBarElement);

            this._contentAreaElement = document.createElement("div");
            this._contentAreaElement.classList.add("TabPaneContentArea");
            this.getElement().appendChild(this._contentAreaElement);

            this._iconSize = RENDER_ICON_SIZE;
        }

        addTab(label: string, icon: IImage, content: Control, closeable = false, selectIt = true): void {

            const labelElement = this.makeLabel(label, icon, closeable);
            this._titleBarElement.appendChild(labelElement);
            labelElement.addEventListener("mousedown", e => {

                if (e.button !== 0) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    return;
                }

                if (TabPane.isTabCloseIcon(e.target as HTMLElement)) {
                    return;
                }

                this.selectTab(labelElement);
            });

            const contentArea = new Control("div", "ContentArea");
            contentArea.add(content);
            this._contentAreaElement.appendChild(contentArea.getElement());

            labelElement["__contentArea"] = contentArea.getElement();

            if (selectIt) {

                if (this._titleBarElement.childElementCount === 1) {
                    this.selectTab(labelElement);
                }
            }
        }

        getTabIconSize() {
            return this._iconSize;
        }

        setTabIconSize(size: number) {

            this._iconSize = Math.max(RENDER_ICON_SIZE, size);

            for (let i = 0; i < this._titleBarElement.children.length; i++) {

                const label = this._titleBarElement.children.item(i);

                const iconCanvas = label.firstChild as HTMLCanvasElement;

                TabIconManager.getManager(iconCanvas).resize(this._iconSize);

                this.layout();
            }

            this.eventTabLabelResized.fire();
        }

        incrementTabIconSize(amount: number) {
            this.setTabIconSize(this._iconSize + amount);
        }

        private makeLabel(label: string, icon: IImage, closeable: boolean): HTMLElement {

            const labelElement = document.createElement("div");
            labelElement.classList.add("TabPaneLabel");

            const tabIconElement = TabIconManager.createElement(icon, this._iconSize);
            labelElement.appendChild(tabIconElement);

            const textElement = document.createElement("span");
            textElement.innerHTML = label;
            labelElement.appendChild(textElement);

            if (closeable) {

                const manager = new CloseIconManager();

                manager.setDefaultIcon(ColibriPlugin.getInstance().getIcon(ICON_CONTROL_CLOSE));
                manager.repaint();

                manager.getElement().addEventListener("click", e => {

                    e.stopImmediatePropagation();

                    this.closeTabLabel(labelElement);
                });

                labelElement.appendChild(manager.getElement());
                labelElement.classList.add("closeable");
                CloseIconManager.setManager(labelElement, manager);
            }

            labelElement.addEventListener("contextmenu", e => this.showTabLabelMenu(e, labelElement));

            return labelElement;
        }

        private showTabLabelMenu(e: MouseEvent, labelElement: HTMLElement) {

            e.preventDefault();

            const menu = new Menu();

            this.fillTabMenu(menu, labelElement);

            menu.createWithEvent(e);
        }

        protected fillTabMenu(menu: Menu, labelElement: HTMLElement) {
            // nothing
        }

        setTabCloseIcons(labelElement: HTMLElement, icon: IImage, overIcon: IImage) {

            const manager = CloseIconManager.getManager(labelElement);

            if (manager) {

                manager.setDefaultIcon(icon);
                manager.setOverIcon(overIcon);
                manager.repaint();
            }
        }

        closeTab(content: controls.Control) {

            const label = this.getLabelFromContent(content);

            if (label) {

                this.closeTabLabel(label);
            }
        }

        closeAll() {

            this._titleBarElement.innerHTML = "";
            this._contentAreaElement.innerHTML = "";
        }

        protected closeTabLabel(labelElement: HTMLElement): void {

            {
                const content = TabPane.getContentFromLabel(labelElement);

                if (!this.eventTabClosed.fire(content)) {

                    return;
                }
            }

            const selectedLabel = this.getSelectedLabelElement();

            this._titleBarElement.removeChild(labelElement);
            const contentArea = labelElement["__contentArea"] as HTMLElement;
            this._contentAreaElement.removeChild(contentArea);

            if (selectedLabel === labelElement) {

                let toSelectLabel: HTMLElement = null;

                let maxTime = -1;

                for (let j = 0; j < this._titleBarElement.children.length; j++) {

                    const label = this._titleBarElement.children.item(j);
                    const time = label["__selected_time"] as number || 0;

                    if (time > maxTime) {

                        toSelectLabel = label as HTMLElement;
                        maxTime = time;
                    }
                }

                if (toSelectLabel) {

                    this.selectTab(toSelectLabel);
                }
            }
        }

        setTabTitle(content: Control, title: string, icon?: IImage) {

            for (let i = 0; i < this._titleBarElement.childElementCount; i++) {

                const label = this._titleBarElement.children.item(i) as HTMLElement;

                const content2 = TabPane.getContentFromLabel(label);

                if (content2 === content) {

                    const iconElement: HTMLCanvasElement = label.firstChild as HTMLCanvasElement;
                    const textElement = iconElement.nextSibling as HTMLElement;

                    const manager = TabIconManager.getManager(iconElement);
                    manager.setIcon(icon);
                    manager.repaint();

                    textElement.innerHTML = title;
                }
            }
        }

        static isTabCloseIcon(element: HTMLElement) {
            return element.classList.contains("TabPaneLabelCloseIcon");
        }

        static isTabLabel(element: HTMLElement) {
            return element.classList.contains("TabPaneLabel");
        }

        getLabelFromContent(content: Control) {

            for (let i = 0; i < this._titleBarElement.childElementCount; i++) {

                const label = this._titleBarElement.children.item(i) as HTMLElement;

                const content2 = TabPane.getContentFromLabel(label);

                if (content2 === content) {
                    return label;
                }
            }

            return null;
        }

        private static getContentAreaFromLabel(labelElement: HTMLElement): HTMLElement {
            return labelElement["__contentArea"];
        }

        static getContentFromLabel(labelElement: HTMLElement) {
            return Control.getControlOf(this.getContentAreaFromLabel(labelElement).firstChild as HTMLElement);
        }

        selectTabWithContent(content: Control) {

            const label = this.getLabelFromContent(content);

            if (label) {

                this.selectTab(label);
            }
        }

        protected selectTab(toSelectLabel: HTMLElement): void {

            if (toSelectLabel) {
                toSelectLabel["__selected_time"] = TabPane._selectedTimeCounter++;
            }

            const selectedLabelElement = this.getSelectedLabelElement();

            if (selectedLabelElement) {

                if (selectedLabelElement === toSelectLabel) {
                    return;
                }

                selectedLabelElement.classList.remove("selected");
                const selectedContentArea = TabPane.getContentAreaFromLabel(selectedLabelElement);
                selectedContentArea.classList.remove("selected");
            }

            toSelectLabel.classList.add("selected");
            const toSelectContentArea = TabPane.getContentAreaFromLabel(toSelectLabel);
            toSelectContentArea.classList.add("selected");
            toSelectLabel.scrollIntoView();

            this.eventTabSelected.fire(TabPane.getContentFromLabel(toSelectLabel));

            this.dispatchLayoutEvent();

        }

        getSelectedTabContent(): Control {

            const label = this.getSelectedLabelElement();

            if (label) {

                const area = TabPane.getContentAreaFromLabel(label);

                return Control.getControlOf(area.firstChild as HTMLElement);
            }

            return null;
        }

        isSelectedLabel(labelElement: HTMLElement) {
            return labelElement === this.getSelectedLabelElement();
        }

        getContentList(): controls.Control[] {

            const list: controls.Control[] = [];

            for (let i = 0; i < this._titleBarElement.children.length; i++) {

                const label = this._titleBarElement.children.item(i) as HTMLElement;

                const content = TabPane.getContentFromLabel(label);

                list.push(content);
            }

            return list;
        }

        private getSelectedLabelElement(): HTMLElement {

            for (let i = 0; i < this._titleBarElement.childElementCount; i++) {

                const label = this._titleBarElement.children.item(i) as HTMLLabelElement;

                if (label.classList.contains("selected")) {

                    return label;
                }
            }

            return undefined;
        }
    }

}
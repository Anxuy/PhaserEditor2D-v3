namespace colibri.ui.ide.properties {

    export class FilteredViewerInPropertySection<T extends controls.viewers.Viewer>
        extends controls.viewers.FilteredViewer<T> {

        constructor(page: controls.properties.PropertyPage, viewer: T, showZoomControls: boolean, ...classList: string[]) {
            super(viewer, showZoomControls, ...classList);

            this.setHandlePosition(false);
            this.style.position = "relative";
            this.style.height = "100%";

            this.resizeTo();

            page.eventControlLayout.addListener(() => {

                this.resizeTo();
            });
        }

        resizeTo() {
            setTimeout(() => {
                const parent = this.getElement().parentElement;
                if (parent) {
                    this.setBounds({
                        width: parent.clientWidth,
                        height: parent.clientHeight
                    });
                }
                this.getViewer().repaint();
            }, 10);
        }

    }

}
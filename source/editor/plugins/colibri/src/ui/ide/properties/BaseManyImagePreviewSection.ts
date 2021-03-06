namespace colibri.ui.ide.properties {

    import controls = colibri.ui.controls;
    import ide = colibri.ui.ide;

    export abstract class BaseManyImagePreviewSection<T> extends controls.properties.PropertySection<T> {

        protected createForm(parent: HTMLDivElement) {
            parent.classList.add("ManyImagePreviewFormArea");

            const viewer = new controls.viewers.TreeViewer();

            viewer.setContentProvider(new controls.viewers.ArrayTreeContentProvider());
            viewer.setTreeRenderer(new controls.viewers.GridTreeViewerRenderer(viewer, false, true));

            this.prepareViewer(viewer);

            const filteredViewer = new ide.properties.FilteredViewerInPropertySection(this.getPage(), viewer, true);
            parent.appendChild(filteredViewer.getElement());

            this.addUpdater(async () => {

                const input = await this.getViewerInput();

                // clean the viewer first
                viewer.setInput([]);
                viewer.repaint();

                viewer.setInput(input);
                filteredViewer.resizeTo();
            });
        }

        protected abstract async getViewerInput(): Promise<unknown>;

        protected abstract prepareViewer(viewer: controls.viewers.TreeViewer);

        canEditNumber(n: number): boolean {
            return n > 1;
        }
    }
}
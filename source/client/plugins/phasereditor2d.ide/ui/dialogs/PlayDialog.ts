namespace phasereditor2d.ide.ui.dialogs {

    import controls = colibri.ui.controls;

    export class PlayDialog extends controls.dialogs.Dialog {

        private _url: string;

        constructor(url: string) {
            super("PlayDialog");

            this._url = url;

        }

        protected resize() {

            const width = Math.floor(window.innerWidth * 0.6);
            const height = Math.floor(window.innerHeight * 0.75);

            this.setBounds({
                x: window.innerWidth / 2 - width / 2,
                y: 10,
                width: width,
                height: height
            });
        }

        createDialogArea() {

            const frameElement = document.createElement("iframe");

            frameElement.classList.add("DialogClientArea");
            frameElement.src = this._url;
            frameElement.addEventListener("load", e => {

                frameElement.contentDocument.addEventListener("keydown", e => {

                    if (e.key === "Escape") {

                        this.close();
                    }
                });
            });

            this.getElement().appendChild(frameElement);
        }

        create() {

            super.create();

            this.setTitle("Play");

            this.addCancelButton();
        }
    }
}
namespace phasereditor2d.scene.ui.dialogs {

    export class NewSceneFileDialogExtension extends files.ui.dialogs.NewFileContentExtension {

        constructor() {
            super({
                dialogName: "Scene File",
                dialogIcon: ScenePlugin.getInstance().getIcon(ICON_GROUP),
                fileExtension: "scene",
                initialFileName: "Scene"
            });
        }

        getCreateFileContentFunc() {

            return (args: files.ui.dialogs.ICreateFileContentArgs) => {

                let name = args.fileName;

                const i = name.lastIndexOf(".");

                if (i > 0) {

                    name = name.substring(0, i);
                }

                const sceneData: core.json.ISceneData = {
                    id: Phaser.Utils.String.UUID(),
                    settings: {
                        compilerOutputLanguage: ScenePlugin.getInstance().getDefaultSceneLanguage(),
                        sceneKey: name
                    },
                    sceneType: core.json.SceneType.SCENE,
                    displayList: [],
                    meta: {
                        app: "Phaser Editor 2D - Scene Editor",
                        url: "https://phasereditor2d.com",
                        contentType: scene.core.CONTENT_TYPE_SCENE
                    }
                };

                return JSON.stringify(sceneData, null, 2);
            };
        }

        getInitialFileLocation() {
            return super.findInitialFileLocationBasedOnContentType(scene.core.CONTENT_TYPE_SCENE);
        }
    }
}
namespace phasereditor2d.scene.ui.sceneobjects {

    export class AngleTool extends editor.tools.SceneTool {

        static ID = "phasereditor2d.scene.ui.sceneobjects.AngleTool";

        constructor() {
            super(AngleTool.ID);
        }

        canEdit(obj: unknown): boolean {

            return obj instanceof Phaser.GameObjects.GameObject
                && (obj as unknown as ISceneObject).getEditorSupport().hasComponent(TransformComponent);
        }
    }
}
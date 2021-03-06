namespace phasereditor2d.scene.ui.sceneobjects {

    export class VariableComponent extends Component<ISceneObjectLike> {

        static label: IProperty<ISceneObjectLike> = {
            name: "label",
            tooltip: "The variable name of the object.",
            defValue: undefined,
            local: true,
            getValue: obj => obj.getEditorSupport().getLabel(),
            setValue: (obj, value) => obj.getEditorSupport().setLabel(value)
        };

        static scope: IEnumProperty<ISceneObjectLike, ObjectScope> = {
            name: "scope",
            tooltip: "The variable lexical scope.",
            defValue: ObjectScope.METHOD,
            local: true,
            getValue: obj => obj.getEditorSupport().getScope(),
            setValue: (obj, value) => obj.getEditorSupport().setScope(value),
            values: [ObjectScope.METHOD, ObjectScope.CLASS, ObjectScope.PUBLIC],
            getValueLabel: value => value[0] + value.toLowerCase().substring(1)
        };

        constructor(obj: ISceneObjectLike) {
            super(obj, [
                VariableComponent.label,
                VariableComponent.scope
            ]);
        }

        buildSetObjectPropertiesCodeDOM(args: ISetObjectPropertiesCodeDOMArgs): void {
            // nothing
        }
    }
}
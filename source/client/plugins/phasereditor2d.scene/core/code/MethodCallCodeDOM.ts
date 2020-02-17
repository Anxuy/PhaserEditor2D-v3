namespace phasereditor2d.scene.core.code {

    export class MethodCallCodeDOM extends CodeDOM {

        private _methodName: string;
        private _contextExpr: string;
        private _args: string[];
        private _returnToVar: string;
        private _declareReturnToVar: boolean;
        private _declareReturnToField: boolean;
        private _isConstructor: boolean;

        constructor(methodName: string, contextExpr = "") {
            super();

            this._methodName = methodName;
            this._contextExpr = contextExpr;
            this._args = [];
            this._declareReturnToVar = false;
            this._isConstructor = false;
            this._declareReturnToField = false;
        }

        isConstructor() {
            return this._isConstructor;
        }

        setConstructor(isConstructor: boolean) {
            this._isConstructor = isConstructor;
        }

        getReturnToVar() {
            return this._returnToVar;
        }

        setReturnToVar(returnToVar: string) {
            this._returnToVar = returnToVar;
        }

        setDeclareReturnToVar(declareReturnToVar: boolean) {
            this._declareReturnToVar = declareReturnToVar;
        }

        isDeclareReturnToVar() {
            return this._declareReturnToVar;
        }

        setDeclareReturnToField(declareReturnToField: boolean) {
            this._declareReturnToField = declareReturnToField;
        }

        isDeclareReturnToField() {
            return this._declareReturnToField;
        }

        arg(expr: string) {

            this._args.push(expr);
        }

        argStringOrFloat(expr: string | number) {

            if (typeof expr === "string") {

                this.argLiteral(expr);

            } else {

                this.argFloat(expr);
            }
        }

        argStringOrInt(expr: string | number) {

            if (typeof expr === "string") {

                this.argLiteral(expr);

            } else {

                this.argInt(expr);
            }
        }

        argLiteral(expr: string) {

            this._args.push(CodeDOM.quote(expr));
        }

        argFloat(n: number) {

            this._args.push(n + "");
        }

        argInt(n: number) {

            this._args.push(Math.floor(n) + "");
        }

        getMethodName() {
            return this._methodName;
        }

        setMethodName(methodName: string) {
            this._methodName = methodName;
        }

        getContextExpr() {
            return this._contextExpr;
        }

        getArgs() {
            return this._args;
        }
    }
}
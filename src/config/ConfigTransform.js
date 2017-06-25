class ConfigTransform {
    constructor() {
        this.query    = null;
        this.response = null;
        this.entry    = null;
        this.error    = null;

        Object.seal(this);
    }
}

export default ConfigTransform;
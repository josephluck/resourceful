class ConfigFs {
    constructor() {
        this.path        = '';
        this.extension   = '';
        this.nameKey     = '';
        this.indentation = 4;
        this.getFilename = null;

        Object.seal(this);
    }
}

export default ConfigFs;
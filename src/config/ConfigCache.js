class ConfigCache {
    constructor() {
        this.enable        = true;
        this.primaryKey    = '';
        this.secondaryKeys = [];

        Object.seal(this);
    }
}

export default ConfigCache;
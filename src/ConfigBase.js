class ConfigBase {
    constructor() {
        this.enableCache        = true;
        this.primaryKey         = '';
        this.secondaryKeys      = [];
        this.transformResponse  = null;
        this.transformEntry     = null;
        this.Model              = null;
    }
}

export default ConfigBase;
class ConfigBase {
    constructor() {
        this.enableCache        = true;
        this.primaryKey         = '';
        this.secondaryKeys      = [];
        this.transformQuery     = null;
        this.transformResponse  = null;
        this.transformEntry     = null;
        this.transformError     = null;
        this.Model              = null;
    }
}

export default ConfigBase;
import ConfigBase from './ConfigBase.js';

class ConfigFs extends ConfigBase {
    constructor() {
        super();

        this.path       = '';
        this.extension  = '';
        this.nameAlias  = '';

        Object.seal(this);
    }
}

export default ConfigFs;
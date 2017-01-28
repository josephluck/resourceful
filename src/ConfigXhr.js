import ConfigBase from './ConfigBase.js';

class ConfigXhr extends ConfigBase {
    constructor() {
        super();

        this.path = '';

        Object.seal(this);
    }
}

export default ConfigXhr;
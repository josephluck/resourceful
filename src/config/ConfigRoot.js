import ConfigCache     from './ConfigCache';
import ConfigData      from './ConfigData';
import ConfigTransform from './ConfigTransform';

class ConfigRoot {
    constructor() {
        this.cache      = new ConfigCache();
        this.transform  = new ConfigTransform();
        this.data       = new ConfigData();
    }
}

export default ConfigRoot;
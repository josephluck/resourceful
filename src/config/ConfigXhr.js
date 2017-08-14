class ConfigXhr {
    constructor() {
        this.path    = '';
        this.timeout = 10000;

        Object.seal(this);
    }
}

export default ConfigXhr;
class File {
    constructor(name, contents) {
        this.name       = name || '';
        this.contents   = contents || '';

        Object.seal(this);
    }
}

export default File;
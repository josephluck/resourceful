class IResource {
    constructor() {
        const _ = new this.constructor.Implementation(...arguments);

        this.get                = _.get.bind(_);
        this.getOne             = _.getOne.bind(_);
        this.update             = _.update.bind(_);
        this.create             = _.create.bind(_);
        this.delete             = _.delete.bind(_);
        this.flushCache         = _.flushCache.bind(_);
        this.flushCacheStore    = _.flushCacheStore.bind(_);

        Object.seal(this);
    }
}

export default IResource;
class Api {
    constructor(dataset) {
        let _db = [];

        Object.defineProperties(this, {
            db: {
                get() {
                    return _db.slice();
                },
                set(value) {
                    if (!Array.isArray(value)) {
                        throw new TypeError('[mock-api] Dataset must be an array');
                    }

                    if (!value.length) {
                        throw new TypeError('[mock-api] Dataset must contain one or more elements');
                    }

                    _db = value;
                }
            }
        });

        this.init(dataset);
    }

    init(dataset) {
        this.db = dataset;
    }

    get(query) {
        var self = this;

        return Promise.resolve()
            .then(function() {
                var output = [];

                query = Object.assign(new Api.Query(), query);

                Object.freeze(query);

                output = self.filter(self.db, query);

                output = self.sort(output, query);

                return output;
            });
    }

    filter(input, query) {
        return input.filter(item => {
            for (let key in query) {
                let value = null;

                if (key.match(/^\$/g)) continue;

                value = query[key];

                if (value === 'all') return true;

                if (item[key] !== value) return false;
            }

            return true;
        });
    }

    sort(input, query) {
        return input.sort((a, b) => {
            var valueA = a[query.$sortBy];
            var valueB = b[query.$sortBy];

            if (valueA > valueB) {
                return query.$order === 'asc' ? 1 : -1;
            } else if (valueA < valueB) {
                return query.$order === 'asc' ? -1 : 1;
            }

            return 0;
        });
    }
}

Api.Query = function() {
    this.$sortBy = 'id';
    this.$order  = 'asc';
};

export default Api;
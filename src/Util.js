class Util {

    /**
     * @param   {object}    target
     * @param   {object}    source
     * @param   {boolean}   [deep=false]
     * @return  {object}
     */

    static extend(target, source, deep=false) {
        let sourceKeys = [];

        if (!target || typeof target !== 'object') {
            throw new TypeError('[Util#extend] Target must be a valid object');
        }

        if (Array.isArray(source)) {
            for (let i = 0; i < source.length; i++) {
                sourceKeys.push(i);
            }
        } else if (source) {
            sourceKeys = Object.keys(source);
        }

        for (let i = 0; i < sourceKeys.length; i++) {
            let key = sourceKeys[i];
            let descriptor = Object.getOwnPropertyDescriptor(source, key);

            // Skip non-enumerable computed properties

            if (typeof descriptor.get === 'function' && !descriptor.enumerable) continue;

            if (!deep || typeof source[key] !== 'object' || source[key] === null) {
                // All non-object primitives, or all properties if
                // shallow extend

                target[key] = source[key];
            } else if (Array.isArray(source[key])) {
                // Arrays

                if (!target[key]) {
                    target[key] = [];
                }

                this.extend(target[key], source[key], deep);
            } else {
                // Objects

                if (!target[key]) {
                    target[key] = {};
                }

                this.extend(target[key], source[key], deep);
            }
        }

        return target;
    }
}

export default Util;
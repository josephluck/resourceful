# Resourceful

A promised-based interface for isomoprhic resources with built-in caching.

## Overview

Resourceful implements a simple respository interface for querying data in universal code. Implementation details are abstracted away from the comsumer so that the appropriate type of resource (e.g. XHR, DB, FS) may be injected into an arbitrary universal module (typically something that depends on the same data model on both the client and server) without affecting integration code.

Resourceful allows you to create individual "resource" instances, each one providing a common promise-based-interface for a particular data type and source.

#### Contents
- [Integrations](#integrations)
- [API](#api)
- [Instantiation](#instantiation)
- [Custom Data Models](#custom-data-models)

## Integrations

Currently, the following integrations exist:

#### ResourceXHR

A client-side resource for querying JSON over an API using XHR.

#### ResourceMongoose

A server-side resource for querying MongoDB documents via Mongoose ODM.

#### ResourceFS

A server-side resource for querying all files of a type or one specific file in a file-system directory.

Additionally, an abstract `ResourceBase` class, and the public interface `IResource` are provided so that new integrations can be to be added with ease.

## API

The `IResource` interface implements the following API methods, which all resource integrations must expose.

### .get()

`.get(query[, req][, res])`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object containing one or more key value pairs
| param  | object | [req] | An optional request object to passed to the underlying implementation (e.g. for authentication)
| param  | object | [res] | An optional response object to be passed to the underlying implementation (e.g. for authentication)
| return | Promise.<Array.<object>> | A list of entries matching the query
  
Returns a Promise resolving with a list of entries matching the provided query.

### .getOne()

`.getOne(query[, req][, res])`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object containing one or more key value pairs
| param  | object | [req] | An optional request object to passed to the underlying implementation (e.g. for authentication)
| param  | object | [res] | An optional response object to be passed to the underlying implementation (e.g. for authentication)
| return | Promise.<Array.<(object|null)>> | An entry matching the query or null
  
Returns a Promise resolving with a single entry matching the provided query, or `null` if none found. This is a shorthand for `.get()[0]`, and can be used when querying by a unique ID.

### .create()

`.create(payload)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | payload | An object containing the data to be created
| return | Promise.<object> | The newly created item
  
Creates an entry and returns a promise resolving with that new entry on success.

### .update()

`.update(query, payload)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object typically containing a single key value pair to match an item's unique ID
| param  | object | payload | An object containing the data to be created
| return | Promise.<object> | The newly created item

Updates an existing entry (by query) and returns a promise resolving with that updated entry on success.

### .delete()

`.delete(query)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object typically containing a single key value pair to match an item's unique ID
| return | Promise.<object> | The deleted item

Deletes an existing entry (by query) and returns a promise resolving with that deleted entry on success.

### .flushCacheStore()

`.flushCacheStore(query)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object containing one or more key value pairs
| return | void   |

Deletes one or more entries from the cache matching the provided query.

### .flushCache()

`.flushCache()`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| return | void   |

Deletes the resource's entire cache

## Instantiation

Each resource type follows the same basic pattern for instantiation.

A typical client-side resource file might look like the following:

#### ./resources/client/people.js

```js
import {ResourceXHR} from 'resourceful';

const people = new ResourceXHR({
    // configuration options
});

export default people;
```

And its server-side equivalent:

#### ./resources/server/people.js

```js
import {ResourceMongoose} from 'resourceful';

const people = new ResourceMongoose({
    // congiguration options
});

export default people;
```

As above, it is very common for resources to be defined in pairs, so that the appropriate resource can be easily injected into universal code regardless of its type, and will yield identical results when called.

The only difference in the above two options would be the configuration.

## Configuration

All resource types implement the common configuration options shown below. In addition to these, implementation specific configuration options exist for each type of integration. These can be found in the integration specific documentation which is linked to in the [Integrations](#integrations) section above.

```
Config {
   cache: {
       enable: true,
       primaryKey: '',
       secondaryKeys: []
   },
   data: {
       init: null,
       Model: null
   },
   transform: {
       query: null,
       response: null,
       entry: null,
       error: null
   }
}
```

### cache

A collection of options relating to a resource's internal cache.

- `enable`

A boolean dictating whether or not caching should be enabled for the resource.

|Type | Default
|---  | ---
|`boolean`| `true`

- `primaryKey`

An optional unique primary key present in all items to cache by. When a list of matching entries is returned by a non unique query, each one may then be cached individually by a unique ID for fast lookup at a later time.

|Type | Default
|---  | ---
|`string`| `''`

- `secondaryKeys`

As above, but allows multiple secondary keys to be specified.

|Type | Default
|---  | ---
|`Array.<string>`| `[]`

### data

A collection of options relating to data contained by the resource.

- `init`

An optional array of entries or "init data" to be provided to the resource on instantiation, matching the expected first request to the resource. This can be useful in a client side resource, where its first query may be to fetch something that is already available (for example, via a server-rendered document), and thus prevents an uneccessary API call.

|Type | Default
|---  | ---
|`Array.<object>`| `[]`

- `Model`

An optional class or constructor function used to coerce data into a custom model before being returned to the consumer. When provided, data is still cached in its raw form, and coerced only upon request. This is particularly useful when virtual properties are needed on an object (e.g. a `fullName`, property combining `firstName` and `lastName`).

|Type | Default
|---  | ---
|`function`| `null`

### transform

A collection of optional data transform functions. Functions may be syncronous, or promise-returning asyncronous functions, allowing for the plugging in of calls to other resources in order to map in additional data to an object before being returned to the consumer.

All functions receive the relevant object as their parameter, and must return an equivalent object, or a Promise resolving with that object.

- `query`

A function allowing transformation of the provided query before it hits the integration.

- `response`

A function allowing transformation of integration's response, before it is written to cache and returned by the resource.

- `entry`

A function allowing transformation of a returned entry, after it has been cached, but before it is returned by the resource.

- `error`

A function allowing transformation of an arbitrary response (e.g. JSON over an API), into an array of one or more errors.

## Custom Data Models

---
*&copy; 2017 Patrick Kunka / KunkaLabs Ltd*

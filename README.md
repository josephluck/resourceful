# Resourceful

A promised-based interface for isomoprhic resources with built-in caching.

## Overview

Resourceful implements a simple respository interface for querying data in universal code. Implementation details are abstracted away from the comsumer so that the appropriate type of resource (e.g. XHR, DB, FS) may be injected into an arbitrary universal module (typically something that depends on the same data model on both the client and server) without affecting integration code.

Resourceful allows you to create individual "resource" instances, each one providing a common promise-based-interface for a particular data type and source.

#### Contents
- [Integrations](#integrations)
- [API](#api)
- [Instantiation](#instantiation)
- [Caching](#caching)
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
| return | Promise.<Array.<object>> | A list of items matching the query
  
Returns a Promise resolving with a list of items matching the provided query.

### .getOne()

`.getOne(query[, req][, res])`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object containing one or more key value pairs
| param  | object | [req] | An optional request object to passed to the underlying implementation (e.g. for authentication)
| param  | object | [res] | An optional response object to be passed to the underlying implementation (e.g. for authentication)
| return | Promise.<Array.<(object|null)>> | An item matching the query or null
  
Returns a Promise resolving with a single item matching the provided query, or `null` if none found. This is a shorthand for `.get()[0]`, and can be used when querying by a unique ID.

### .create()

`.create(payload)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | payload | An object containing the data to be created
| return | Promise.<object> | The newly created item
  
Creates an item and returns a promise resolving with that new item on success.

### .update()

`.update(query, payload)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object typically containing a single key value pair to match an item's unique ID
| param  | object | payload | An object containing the data to be created
| return | Promise.<object> | The newly created item

Updates an existing item (by query) and returns a promise resolving with that updated item on success.

### .delete()

`.delete(query)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object typically containing a single key value pair to match an item's unique ID
| return | Promise.<object> | The deleted item

Deletes an existing item (by query) and returns a promise resolving with that deleted item on success.

### .flushCacheStore()

`.flushCacheStore(query)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | object | query | A query object containing one or more key value pairs
| return | void   |

Deletes one or more items from the cache matching the provided query.

### .flushCache()

`.flushCache()`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| return | void   |

Deletes the resource's entire cache

## Instantiation

Each resource type follows the same basic pattern for instantiation, although specific instantiation instructions and configuration objects for each resource type can be found as links in the [Integrations](#integrations) section above.

A typical resource file might look like the following:

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

## Caching

Todo

## Custom Data Models

---
*&copy; 2017 Patrick Kunka / KunkaLabs Ltd*

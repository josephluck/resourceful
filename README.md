# Resourceful

A promised-based interface for isomoprhic resources with built-in caching.

## Overview

Resourceful implements a simple respository interface for querying data in universal code. Implementation details are abstracted away from the comsumer so that the appropriate type of resource (e.g. XHR, DB, FS) may be injected into a universal service without affecting integration code.

Resourceful allows you to create individual "resource" instances, each one providing a common promise-based-interface for a particular data type and source.

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
| return | Promise.<Array.<object>> | A list of entities matching the query

### .getOne()

`.getOne(query[, req][, res])`

### .create()

`.create(payload)`

### .update()

`.update(query, payload)`

### .delete()

`.delete(query)`

### .flushCacheStore()

`.flushCacheStore(query)`

### .flushCache()

`.flushCache()`


---
*&copy; 2017 Patrick Kunka / KunkaLabs Ltd*

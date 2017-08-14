# ResourceXhr

ResourceXhr provides a promise-based interface over XMLHttpRequest.

ResourceXhr is currently only compatible with JSON API endpoints. When sending any kind of `get` request, a list of items is expected as this is the data store structure used in Resourceful's internal cache, and returned to the consumer.

Other data structures can be used in combination with a consumer-provided `transform.response` function, whereby results are transformed into a list before being written to cache.

## Configuration

In addition to the common configuration options described in the overview documentation, ResourceXhr also exposes the following xhr-specific options.

```
ConfigXhr {
    path: '',
    timeout: 10000
}
```

One or more XHR options are provided as follows via an optional configuration object passed at instantiation.

```js
const people = new ResourceXhr({
    xhr: {
        path: '/api/v2.0/people/',
    }
});
```

### xhr

A collection of options relating to a the XHR integration.

- `path`

The path of the API endpoint abstracted by the resource. Required.

|Type | Default
|---  | ---
|`string`| `''`

- `timeout`

An optional number dictating the maximum allowed time for an XHR request in ms. The request will abort and error once this time has elapsed.

|Type | Default
|---  | ---
|`number`| `10000`

## Utility Functions

ResourceXhr also exposes the following static utility functions which can be helpful when making XHR requests that don't conform to typical RESTful patterns.

#### ResourceXhr.serializeQuery()

`.serializeQuery(query)`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | `object` | query | An object containing one or more serializable key value pairs
| return | `string` | A URI-encoded query string

A function that transforms a query object into a serialized query string compatible with a `GET` or `DELETE` http request. All key names are transformed to "snake_case" as a best practice.

#### ResourceXhr.xhr()

`.xhr(method, path[, data][, timeout=10000])`

|        | Type   | Name  | Description
|--------|--------|-------|-------------
| param  | `('GET','POST','PUT', 'DELETE')` | method | The intended HTTP method. Required.
| param  | `string` | path | A path to an API endpoint. Required.
| param  | `object` | data | An object representing a query or payload data, depending on the type of method. Optional.
| param  | `number` | timeout | The maximum allowed request time in ms. Optional.
| return | `Promise<object>` | A promise resolving with any JSON data returned.

A generic promise-based XHR function for sending requests to JSON API endpoints.
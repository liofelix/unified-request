# @liofelix/unified-request

A unified request client based on axios.

## Installation

```bash
vp add @liofelix/unified-request axios
```

## Usage

```ts
import axios from "axios";
import { createRequestClient, type RequestClientOptions } from "@liofelix/unified-request";

const options: RequestClientOptions = {
  axiosConfig: {
    baseURL: "https://example.com/api",
  },
  interceptors: [
    {
      request: [
        (config) => {
          config.headers.set("x-request-id", crypto.randomUUID());
          return config;
        },
      ],
      response: [
        (response) => response,
        (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // remove token, redirect to login, etc.
          }

          console.error(error);
          return Promise.reject(error);
        },
      ],
    },
  ],
};

const client = createRequestClient(options);

const response = await client.get("/health");
console.log(response.data);
```

## API

### createRequestClient

```ts
function createRequestClient(options?: RequestClientOptions): RequestClient;
```

`createRequestClient` returns the axios instance directly. Response interceptors
keep the axios response shape by default, so callers continue reading business
data from `response.data`.

All axios instance options should be passed through `axiosConfig`:

```ts
createRequestClient({
  axiosConfig: {
    baseURL: "https://example.com/api",
    timeout: 3000,
  },
});
```

Use the second item of `interceptors[].response` for centralized error handling,
including 401 responses. Axios runs request interceptors in reverse registration
order and response interceptors in registration order.

### Types

The package exports these types:

- `RequestClient`
- `RequestClientOptions`
- `RequestClientInterceptor`
- `RequestInterceptor`
- `ResponseInterceptor`

## Development

- Install dependencies:

```bash
vp install
```

- Run the unit tests:

```bash
vp test
```

- Build the library:

```bash
vp pack
```

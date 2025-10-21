<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS Paths
    |--------------------------------------------------------------------------
    |
    | Define the paths the CORS middleware should respond to. We include all API
    | routes and the Sanctum CSRF cookie endpoint so that the frontend running
    | on a different origin can communicate with the Laravel backend.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed HTTP Methods
    |--------------------------------------------------------------------------
    |
    | You may allow any method by using an array containing '*'. Otherwise,
    | list the methods the application should respond to.
    |
    */

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | These origins are allowed to access the CORS protected routes. During
    | development we allow common localhost ports used by Vite or React.
    |
    */

    'allowed_origins' => [],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns
    |--------------------------------------------------------------------------
    |
    | Optionally provide patterns that can be used together with allowed
    | origins. This is useful if you need to match dynamic subdomains.
    |
    */

    'allowed_origins_patterns' => [
        '#^https?://localhost(?:\:\d+)?$#',
        '#^https?://127\.0\.0\.1(?:\:\d+)?$#',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | Specify which headers are allowed in the actual request. Again, using
    | '*' will allow any header.
    |
    */

    'allowed_headers' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | These headers will be exposed on the response.
    |
    */

    'exposed_headers' => [],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    |
    | The number of seconds the results of a preflight request can be cached.
    |
    */

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | Set this to true if your application needs to receive cookies or
    | authorization headers across origins.
    |
    */

    'supports_credentials' => true,

];

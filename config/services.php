<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'snipcart' => [
        'key' => env('SNIPCART_KEY', ''),
        'secret' => env('SNIPCART_SECRET', ''),
        // Llaves del Custom Gateway (Dashboard → Payment Gateway → Primary API key),
        // por entorno. Se usan para confirmar los pagos del gateway, y son distintas
        // del secret REST de la cuenta (SNIPCART_SECRET).
        'test_secret' => env('SNIPCART_TEST_SECRET', ''),
        'live_secret' => env('SNIPCART_LIVE_SECRET', ''),
    ],

    'paypal' => [
        // 'sandbox' para pruebas, 'live' para producción.
        'mode' => env('PAYPAL_MODE', 'sandbox'),

        // Resuelve las credenciales activas según el modo.
        'client_id' => env('PAYPAL_MODE', 'sandbox') === 'live'
            ? env('PAYPAL_LIVE_CLIENT_ID', '')
            : env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'secret' => env('PAYPAL_MODE', 'sandbox') === 'live'
            ? env('PAYPAL_LIVE_SECRET', '')
            : env('PAYPAL_SANDBOX_SECRET', ''),

        // Base URL de la API REST de PayPal según el modo.
        'base_url' => env('PAYPAL_MODE', 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com',
    ],

];

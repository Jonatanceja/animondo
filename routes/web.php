<?php

use App\Http\Controllers\SnipcartWebhookController;
use Illuminate\Support\Facades\Route;

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);

// Webhook de Snipcart para el cálculo de impuestos/descuentos.
Route::post('webhooks/snipcart/taxes', [SnipcartWebhookController::class, 'taxes']);

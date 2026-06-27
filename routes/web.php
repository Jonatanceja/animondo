<?php

use App\Http\Controllers\PayPalGatewayController;
use App\Http\Controllers\SnipcartStockController;
use Illuminate\Support\Facades\Route;

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);

// Inventario de Snipcart (para marcar semanas agotadas).
Route::get('api/snipcart/stock', [SnipcartStockController::class, 'index']);

// ── Custom payment gateway de Snipcart con PayPal (Orders v2) ──
// Webhook de métodos (Snipcart → nosotros).
Route::post('api/paypal/methods', [PayPalGatewayController::class, 'methods']);
// Página de checkout (comprador, con ?publicToken=).
Route::get('paypal/checkout', [PayPalGatewayController::class, 'checkout'])->name('paypal.checkout');
// Crear / capturar orden (navegador → nosotros).
Route::post('api/paypal/orders', [PayPalGatewayController::class, 'createOrder']);
Route::post('api/paypal/orders/capture', [PayPalGatewayController::class, 'capture']);
// Webhook de reembolso (Snipcart → nosotros); el captureId va en la ruta.
Route::post('api/paypal/refund/{capture}', [PayPalGatewayController::class, 'refund']);

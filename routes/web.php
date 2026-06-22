<?php

use App\Http\Controllers\SnipcartStockController;
use Illuminate\Support\Facades\Route;

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);

// Inventario de Snipcart (para marcar semanas agotadas).
Route::get('api/snipcart/stock', [SnipcartStockController::class, 'index']);

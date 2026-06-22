<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SnipcartStockController extends Controller
{
    /**
     * Devuelve un mapa { userDefinedId: stock } con el inventario de Snipcart.
     * Lo usa el frontend para marcar como "Lugares agotados" las semanas sin stock.
     */
    public function index()
    {
        $secret = config('services.snipcart.secret');

        if (empty($secret)) {
            return response()->json([]);
        }

        $map = Cache::remember('snipcart_stock', 60, function () use ($secret) {
            $result = [];

            $resp = Http::withBasicAuth($secret, '')
                ->acceptJson()
                ->get('https://app.snipcart.com/api/products', ['limit' => 100]);

            if (! $resp->successful()) {
                return $result;
            }

            foreach ($resp->json('items', []) as $product) {
                $id = $product['userDefinedId'] ?? null;
                if ($id !== null) {
                    $result[$id] = $product['stock'] ?? null;
                }
            }

            return $result;
        });

        return response()->json($map);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SnipcartWebhookController extends Controller
{
    /**
     * Webhook de cálculo de impuestos de Snipcart (taxes.calculate).
     *
     * Snipcart lo llama desde sus servidores durante el checkout. Lo usamos para
     * aplicar el descuento del 10% cuando hay 2+ talleres en el carrito, como una
     * línea de ajuste negativa. El transporte (id "transporte-…") se excluye, así
     * que el descuento sólo afecta el precio de los cursos.
     */
    public function taxes(Request $request)
    {
        if ($request->input('eventName') !== 'taxes.calculate') {
            return response()->json(['taxes' => []]);
        }

        if (! $this->validateRequest($request)) {
            return response()->json(['message' => 'Invalid Snipcart request token'], 401);
        }

        $rate = (float) config('services.snipcart.discount_rate', 0.10);
        $min = (int) config('services.snipcart.discount_min_courses', 2);
        $transportAmount = (float) config('services.snipcart.transport_amount', 500);

        $courseQty = 0;
        $discountBase = 0.0;

        foreach ($request->input('content.items', []) as $item) {
            // El transporte viejo como producto aparte nunca recibe descuento.
            if (str_starts_with((string) ($item['id'] ?? ''), 'transporte-')) {
                continue;
            }

            $qty = (int) ($item['quantity'] ?? 0);
            $line = (float) ($item['totalPrice'] ?? 0);

            // El transporte va empaquetado como casilla del taller: se descuenta del
            // base para que el 10% aplique sólo al precio del curso, no al transporte.
            if ($this->hasTransport($item)) {
                $line -= $transportAmount * max($qty, 1);
            }

            $courseQty += $qty;
            $discountBase += $line;
        }

        $taxes = [];

        if ($courseQty >= $min && $discountBase > 0) {
            $taxes[] = [
                'name' => 'Descuento '.round($rate * 100).'% ('.$min.'+ talleres)',
                'amount' => -round($discountBase * $rate, 2),
                'rate' => 0,
            ];
        }

        return response()->json(['taxes' => $taxes]);
    }

    /**
     * Indica si el ítem (taller) tiene la casilla de transporte marcada.
     */
    private function hasTransport(array $item): bool
    {
        foreach ($item['customFields'] ?? [] as $field) {
            $name = (string) ($field['name'] ?? '');
            $value = strtolower((string) ($field['value'] ?? ''));

            if (stripos($name, 'transporte') !== false
                && in_array($value, ['true', 'sí', 'si', 'yes', '1'], true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Valida que la petición venga realmente de Snipcart usando el token del header
     * contra la API de Snipcart. Requiere la Secret API Key. Si no está configurada,
     * se omite la validación (útil en pruebas locales).
     */
    private function validateRequest(Request $request): bool
    {
        $secret = config('services.snipcart.secret');

        if (empty($secret)) {
            Log::warning('Webhook de Snipcart recibido sin SNIPCART_SECRET; se omite la validación del token.');

            return true;
        }

        $token = $request->header('X-Snipcart-RequestToken');

        if (empty($token)) {
            return false;
        }

        return Http::withBasicAuth($secret, '')
            ->acceptJson()
            ->get("https://app.snipcart.com/api/requestvalidation/{$token}")
            ->successful();
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

/**
 * Cliente mínimo de la API REST de PayPal (Orders v2).
 *
 * Usa las credenciales de config/services.paypal, que ya resuelven
 * sandbox vs live según PAYPAL_MODE.
 */
class PayPalClient
{
    protected string $baseUrl;
    protected string $clientId;
    protected string $secret;

    public function __construct()
    {
        $this->baseUrl  = rtrim((string) config('services.paypal.base_url'), '/');
        $this->clientId = (string) config('services.paypal.client_id');
        $this->secret   = (string) config('services.paypal.secret');
    }

    /** Token OAuth de aplicación (client_credentials). */
    protected function token(): string
    {
        $resp = Http::asForm()
            ->withBasicAuth($this->clientId, $this->secret)
            ->post($this->baseUrl.'/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        $resp->throw();

        return (string) $resp->json('access_token');
    }

    /**
     * Crea una orden CAPTURE por el monto exacto (server-side, no del cliente).
     *
     * @return string El id de la orden de PayPal.
     */
    public function createOrder(string $amount, string $currency, string $customId, string $description = ''): string
    {
        $resp = Http::withToken($this->token())
            ->acceptJson()
            ->post($this->baseUrl.'/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => strtoupper($currency),
                        'value' => $amount,
                    ],
                    'custom_id' => $customId,
                    'description' => $description ?: 'Animondo',
                ]],
            ]);

        $resp->throw();

        return (string) $resp->json('id');
    }

    /**
     * Captura una orden previamente aprobada por el comprador.
     *
     * Devuelve la respuesta cruda; usa captureId()/isCompleted() para leerla.
     */
    public function captureOrder(string $orderId): Response
    {
        $resp = Http::withToken($this->token())
            ->acceptJson()
            ->withBody('{}', 'application/json')
            ->post($this->baseUrl."/v2/checkout/orders/{$orderId}/capture");

        $resp->throw();

        return $resp;
    }

    /** Id de la captura (transactionId que se manda a Snipcart). */
    public function captureId(Response $capture): ?string
    {
        return $capture->json('purchase_units.0.payments.captures.0.id');
    }

    /** ¿La captura quedó COMPLETED? */
    public function isCompleted(Response $capture): bool
    {
        return $capture->json('purchase_units.0.payments.captures.0.status') === 'COMPLETED'
            || $capture->json('status') === 'COMPLETED';
    }

    /** Reembolsa una captura (total o parcial). */
    public function refund(string $captureId, ?string $amount = null, ?string $currency = null): Response
    {
        $body = [];
        if ($amount !== null && $currency !== null) {
            $body['amount'] = [
                'currency_code' => strtoupper($currency),
                'value' => $amount,
            ];
        }

        $resp = Http::withToken($this->token())
            ->acceptJson()
            ->post($this->baseUrl."/v2/payments/captures/{$captureId}/refund", $body);

        $resp->throw();

        return $resp;
    }
}

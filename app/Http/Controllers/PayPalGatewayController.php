<?php

namespace App\Http\Controllers;

use App\Services\PayPalClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Custom payment gateway de Snipcart con PayPal (Orders v2 / Smart Buttons).
 *
 * Flujo:
 *  1. methods()  — Snipcart pide los métodos de pago (server-to-server).
 *  2. checkout() — el comprador llega a nuestra página con ?publicToken=...
 *  3. createOrder()/capture() — crean y capturan la orden en PayPal.
 *  4. capture() confirma el pago a Snipcart y devuelve la URL de retorno.
 *  5. refund()   — Snipcart llama aquí cuando se reembolsa desde el dashboard.
 */
class PayPalGatewayController extends Controller
{
    /** Base de la API del custom payment gateway de Snipcart. */
    private const SNIPCART_PAY_API = 'https://payment.snipcart.com/api';

    public function __construct(private readonly PayPalClient $paypal)
    {
    }

    /**
     * (1) Webhook de métodos de pago. Snipcart → nosotros (POST).
     * Body: { invoice, publicToken, mode }.
     */
    public function methods(Request $request)
    {
        $publicToken = (string) $request->input('publicToken');

        if (! $this->validToken($publicToken)) {
            return response()->json([], 400);
        }

        // Propagamos el modo (test/live) en el checkoutUrl para usar el
        // secret correcto de Snipcart al confirmar el pago.
        $mode = $request->input('mode', 'live');

        // Snipcart descarta métodos con checkoutUrl inseguro: forzamos https.
        $checkoutUrl = preg_replace('#^http://#i', 'https://', route('paypal.checkout', ['mode' => $mode]));

        return response()->json([[
            'id' => 'paypal',
            'name' => 'PayPal o tarjeta',
            'checkoutUrl' => $checkoutUrl,
        ]]);
    }

    /**
     * (2) Página de checkout. Comprador → nosotros (GET ?publicToken=...).
     */
    public function checkout(Request $request)
    {
        $publicToken = (string) $request->query('publicToken');

        $session = $this->paymentSession($publicToken);
        if (! $session) {
            abort(400, 'Sesión de pago inválida.');
        }

        $invoice = $session['invoice'] ?? [];

        return view('paypal.checkout', [
            'publicToken' => $publicToken,
            'mode' => $request->query('mode', 'live'),
            'clientId' => config('services.paypal.client_id'),
            'currency' => strtoupper($invoice['currency'] ?? 'MXN'),
            'amount' => number_format((float) ($invoice['amount'] ?? 0), 2, '.', ''),
            'returnUrl' => $session['paymentAuthorizationRedirectUrl'] ?? '/',
        ]);
    }

    /**
     * (3) Crear orden en PayPal. Navegador → nosotros (POST { publicToken }).
     * El monto sale de la sesión de Snipcart, NUNCA del cliente.
     */
    public function createOrder(Request $request)
    {
        $publicToken = (string) $request->input('publicToken');

        if (! $this->validToken($publicToken)) {
            return response()->json(['error' => 'invalid_token'], 400);
        }

        $session = $this->paymentSession($publicToken);
        if (! $session) {
            return response()->json(['error' => 'no_session'], 400);
        }

        $invoice = $session['invoice'] ?? [];
        $amount = number_format((float) ($invoice['amount'] ?? 0), 2, '.', '');
        $currency = strtoupper($invoice['currency'] ?? 'MXN');

        $orderId = $this->paypal->createOrder(
            amount: $amount,
            currency: $currency,
            customId: $session['id'] ?? '',
            description: 'Animondo — '.($invoice['email'] ?? ''),
        );

        return response()->json(['id' => $orderId]);
    }

    /**
     * (4) Capturar orden + confirmar a Snipcart. Navegador → nosotros
     * (POST { publicToken, orderID }). Devuelve { returnUrl }.
     */
    public function capture(Request $request)
    {
        $publicToken = (string) $request->input('publicToken');
        $orderId = (string) $request->input('orderID');
        $mode = (string) $request->input('mode', 'live');

        if (! $this->validToken($publicToken) || $orderId === '') {
            return response()->json(['error' => 'invalid_request'], 400);
        }

        $session = $this->paymentSession($publicToken);
        if (! $session) {
            return response()->json(['error' => 'no_session'], 400);
        }

        $invoice = $session['invoice'] ?? [];
        $sessionId = $session['id'] ?? '';
        $returnUrl = $session['paymentAuthorizationRedirectUrl'] ?? '/';

        $capture = $this->paypal->captureOrder($orderId);
        $captureId = $this->paypal->captureId($capture);

        if (! $this->paypal->isCompleted($capture) || ! $captureId) {
            $this->confirmToSnipcart($sessionId, 'failed', $captureId, [
                'code' => 'capture_failed',
                'message' => 'No se pudo capturar el pago en PayPal.',
            ], [], $mode);

            return response()->json(['error' => 'capture_failed'], 422);
        }

        // El link de refunds lleva el captureId embebido: Snipcart lo llama tal cual.
        $this->confirmToSnipcart($sessionId, 'processed', $captureId, null, [
            'currency' => strtoupper($invoice['currency'] ?? 'MXN'),
            'refundsUrl' => url('/api/paypal/refund/'.$captureId),
        ], $mode);

        return response()->json(['returnUrl' => $returnUrl]);
    }

    /**
     * (5) Webhook de reembolso. Snipcart → nosotros (POST { paymentId, amount }).
     * El captureId viene en la ruta (lo embebimos en links.refunds).
     */
    public function refund(Request $request, string $capture)
    {
        $amount = $request->input('amount');

        $resp = $this->paypal->refund(
            captureId: $capture,
            amount: $amount !== null ? number_format((float) $amount, 2, '.', '') : null,
            currency: $amount !== null ? (string) config('services.paypal.refund_currency', 'MXN') : null,
        );

        return response()->json([
            'refundId' => $resp->json('id'),
        ]);
    }

    // ── Helpers de Snipcart ────────────────────────────────────────────────

    /** Valida que el publicToken provenga realmente de Snipcart. */
    private function validToken(string $publicToken): bool
    {
        if ($publicToken === '') {
            return false;
        }

        return Http::acceptJson()
            ->get(self::SNIPCART_PAY_API.'/public/custom-payment-gateway/validate', [
                'publicToken' => $publicToken,
            ])
            ->successful();
    }

    /** Trae la sesión de pago (invoice con monto/moneda y returnUrl). */
    private function paymentSession(string $publicToken): ?array
    {
        if ($publicToken === '') {
            return null;
        }

        $resp = Http::acceptJson()
            ->get(self::SNIPCART_PAY_API.'/public/custom-payment-gateway/payment-session', [
                'publicToken' => $publicToken,
            ]);

        return $resp->successful() ? $resp->json() : null;
    }

    /** Confirma (o marca como fallida) la sesión de pago en Snipcart. */
    private function confirmToSnipcart(string $sessionId, string $state, ?string $transactionId, ?array $error = null, array $extra = [], string $mode = 'live'): void
    {
        $payload = array_filter([
            'paymentSessionId' => $sessionId,
            'state' => $state,
            'transactionId' => $transactionId,
            'error' => $error,
        ], fn ($v) => $v !== null);

        if (! empty($extra['refundsUrl'])) {
            $payload['links'] = ['refunds' => $extra['refundsUrl']];
        }

        // El gateway se confirma con la Primary API key del Payment Gateway (por
        // entorno), no con el secret REST de la cuenta. En live cae a SNIPCART_SECRET
        // solo si no se configuró la llave dedicada.
        $secret = $mode === 'test'
            ? config('services.snipcart.test_secret')
            : (config('services.snipcart.live_secret') ?: config('services.snipcart.secret'));

        $resp = Http::withToken($secret)
            ->acceptJson()
            ->post(self::SNIPCART_PAY_API.'/private/custom-payment-gateway/payment', $payload);

        if (! $resp->successful()) {
            Log::error('Snipcart payment confirm failed', [
                'status' => $resp->status(),
                'body' => $resp->body(),
                'sessionId' => $sessionId,
            ]);
        }
    }
}

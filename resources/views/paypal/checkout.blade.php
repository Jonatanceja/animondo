<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Pago con PayPal — Animondo</title>
    <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f4f4f5;
            color: #18181b;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }
        .card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,.08);
            max-width: 420px;
            width: 100%;
            padding: 2rem 1.75rem;
        }
        h1 { font-size: 1.15rem; margin: 0 0 .25rem; }
        .muted { color: #71717a; font-size: .9rem; margin: 0 0 1.25rem; }
        .total {
            display: flex; justify-content: space-between; align-items: baseline;
            padding: .9rem 0; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7;
            margin-bottom: 1.25rem;
        }
        .total strong { font-size: 1.35rem; }
        #paypal-buttons { min-height: 50px; }
        #status { margin-top: 1rem; font-size: .9rem; text-align: center; min-height: 1.2em; }
        #status.error { color: #dc2626; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Confirma tu pago</h1>
        <p class="muted">Pago seguro con PayPal o tarjeta (no necesitas cuenta de PayPal).</p>

        <div class="total">
            <span>Total</span>
            <strong>${{ number_format((float) $amount, 2) }} {{ $currency }}</strong>
        </div>

        <div id="paypal-buttons"></div>
        <div id="status"></div>
    </div>

    <script src="https://www.paypal.com/sdk/js?client-id={{ $clientId }}&currency={{ $currency }}&intent=capture&enable-funding=card"></script>
    <script>
        (function () {
            var publicToken = @json($publicToken);
            var mode        = @json($mode);
            var returnUrl   = @json($returnUrl);
            var statusEl    = document.getElementById('status');

            function setStatus(msg, isError) {
                statusEl.textContent = msg || '';
                statusEl.className = isError ? 'error' : '';
            }

            if (!window.paypal) {
                setStatus('No se pudo cargar PayPal. Recarga la página.', true);
                return;
            }

            paypal.Buttons({
                createOrder: function () {
                    return fetch('/api/paypal/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ publicToken: publicToken })
                    })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        if (!data.id) { throw new Error('No se pudo crear la orden.'); }
                        return data.id;
                    });
                },
                onApprove: function (data) {
                    setStatus('Procesando pago…');
                    return fetch('/api/paypal/orders/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ publicToken: publicToken, orderID: data.orderID, mode: mode })
                    })
                    .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
                    .then(function (res) {
                        if (res.ok && res.body.returnUrl) {
                            setStatus('¡Pago aprobado! Redirigiendo…');
                            window.location.href = res.body.returnUrl;
                        } else {
                            setStatus('El pago no pudo completarse. Intenta de nuevo.', true);
                        }
                    });
                },
                onError: function () {
                    setStatus('Ocurrió un error con el pago. Intenta de nuevo.', true);
                }
            }).render('#paypal-buttons');
        })();
    </script>
</body>
</html>

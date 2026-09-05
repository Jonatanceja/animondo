<?php

namespace App\Providers;

use Illuminate\Support\Carbon;
use Illuminate\Support\ServiceProvider;
use Statamic\Facades\Collection;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->semanasDeTaller();
    }

    /**
     * Los talleres de verano se venden por semanas sueltas, cada una con su
     * fecha. Una semana que ya pasó no se puede reservar, así que deja de
     * mostrarse; y cuando no queda ninguna, el taller entero pasa a
     * "Próximamente" en las tarjetas de la home y de /talleres.
     *
     * Esto va en PHP y no en la plantilla por dos razones. La primera es que
     * Antlers no compara fechas de forma fiable: `{{ now }}` llega vacío según
     * el contexto desde el que se renderice, y entonces `fecha >= now` sale
     * cierta siempre. Ese es justo el fallo que no se puede permitir aquí,
     * porque el modo en que falla es seguir vendiendo semanas terminadas. La
     * segunda es que así la semana pasada no llega ni al HTML, y con ella se va
     * su botón de compra: no queda nada que un enlace viejo pueda disparar.
     *
     * Los talleres que no van por semanas —los sabatinos, los vespertinos— no
     * tienen `resumen` y no caducan: para ellos `hay_fechas` es siempre cierto
     * y las tarjetas siguen dependiendo del horario, como antes.
     */
    private function semanasDeTaller(): void
    {
        /**
         * Las semanas que todavía se pueden reservar, con su posición original
         * como clave. Devuelve null si el taller no va por semanas, que no es
         * lo mismo que quedarse sin ninguna.
         */
        $abiertas = function ($entry) {
            $semanas = $entry->augmentedValue('resumen')->value();

            if (! $semanas) {
                return null;
            }

            // Hasta el final del día en que termina: una semana que acaba el
            // viernes sigue en pie ese viernes y desaparece el sábado.
            $hoy = Carbon::now()->startOfDay();

            return collect($semanas)->filter(function ($semana) use ($hoy) {
                $fin = $semana['fecha_de_finalizacion']
                    ?? $semana['fecha_de_inicio']
                    ?? null;

                // Sin fecha no caduca: será una semana que aún no la tiene
                // puesta, no una que ya pasó.
                return ! $fin instanceof Carbon
                    || $fin->copy()->startOfDay()->gte($hoy);
            });
        };

        Collection::computed('talleres', 'semanas_abiertas', function ($entry) use ($abiertas) {
            return $abiertas($entry)?->values()->all();
        });

        // Cuántas quedaron atrás. Sirve para que la numeración de las tarjetas
        // no se reinicie: la que se anunciaba como "Semana 3" tiene que seguir
        // llamándose así cuando las dos primeras ya no estén, o no cuadraría
        // con las semanas temáticas que enumera la descripción.
        Collection::computed('talleres', 'desfase_semanas', function ($entry) use ($abiertas) {
            $lista = $abiertas($entry);

            return $lista ? ($lista->keys()->first() ?? 0) : 0;
        });

        Collection::computed('talleres', 'hay_fechas', function ($entry) use ($abiertas) {
            $lista = $abiertas($entry);

            return $lista === null || $lista->isNotEmpty();
        });
    }
}

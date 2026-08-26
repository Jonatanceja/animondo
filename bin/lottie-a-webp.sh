#!/bin/bash
#
# Convierte un .lottie hecho de secuencia de imágenes en un WebP animado.
#
#   bin/lottie-a-webp.sh public/assets/lotties/unicornio.lottie [alto] [colores] [--recortar]
#
# Por qué: los personajes están dibujados a mano y exportados como secuencia de
# PNG, no como vectores. Metidos en un .lottie eso pesa megas, porque el formato
# guarda cada fotograma entero y no comprime entre uno y otro. Tres cosas lo
# arreglan, y las tres las hace este script:
#
#   · bajar la resolución, que estos vienen en 4K y se ven a menos de mil px;
#   · bajar la paleta, que en dibujo de línea son cuatro colores contados;
#   · fundir los fotogramas repetidos — las animaciones "a dos" traen cada
#     dibujo duplicado, y ahí se va la mitad del peso.
#
# Por omisión respeta el lienzo original, así el .webp entra en el sitio de su
# .lottie sin tocar una sola clase de tamaño. Con --recortar lo ajusta al dibujo:
# queda más nítido a igualdad de peso, pero el encuadre cambia y hay que
# reajustar a mano las clases `w-*` y `scale-*` de donde se use.
#
# Si el .lottie es vectorial de verdad, no lo toques: ya pesa lo que debe.
#
# Requiere: brew install ffmpeg webp
#
set -euo pipefail

IN="${1:-}"
ALTO="${2:-900}"
COLORES="${3:-4}"
RECORTAR="${4:-}"

[ -n "$IN" ] && [ -f "$IN" ] || { echo "uso: $0 archivo.lottie [alto] [colores]" >&2; exit 1; }
for cmd in ffmpeg ffprobe img2webp webpmux unzip; do
    command -v "$cmd" >/dev/null || { echo "falta $cmd (brew install ffmpeg webp)" >&2; exit 1; }
done

BASE=$(basename "$IN" .lottie)
SALIDA="$(dirname "$IN")/$BASE.webp"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

unzip -q "$IN" -d "$TMP/x"
PRIMERA=$(find "$TMP/x" -name '*.png' | head -1)
[ -n "$PRIMERA" ] || { echo "no trae secuencia de imágenes: es vectorial, déjalo como está" >&2; exit 1; }

# Los fotogramas se llaman imgSeq_N.png o seq_0_N.png según qué los exportó:
# se renumeran a un patrón fijo para que ffmpeg los lea en orden.
mkdir -p "$TMP/in" "$TMP/out"
n=0
while IFS= read -r f; do
    printf -v destino "$TMP/in/%04d.png" "$n"
    cp "$f" "$destino"
    n=$((n + 1))
done < <(find "$(dirname "$PRIMERA")" -name '*.png' | sort -t_ -k2 -n)

echo "$n fotogramas · $(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$TMP/in/0000.png")"

RECORTE=""
if [ "$RECORTAR" = "--recortar" ]; then
    # El recuadro que ocupa el dibujo, mirando el canal alfa de la secuencia entera.
    CROP=$(ffmpeg -nostdin -v info -i "$TMP/in/%04d.png" \
        -vf "format=rgba,alphaextract,cropdetect=limit=0.02:round=2:reset=0" -f null - 2>&1 \
        | grep -o "crop=[0-9:]*" | tail -1 | cut -d= -f2)
    [ -n "$CROP" ] || { echo "no se pudo medir el recorte" >&2; exit 1; }
    echo "recorte: $CROP"
    RECORTE="crop=${CROP},"
fi

ESCALA="scale=-2:${ALTO}:flags=lanczos"

# Paleta única para toda la secuencia: si se calcula por fotograma, los colores
# bailan entre uno y otro. Sin dithering, que en dibujo de línea sólo es ruido
# y además le arruina la compresión al WebP.
ffmpeg -nostdin -v error -y -i "$TMP/in/%04d.png" \
    -vf "format=rgba,${RECORTE}${ESCALA},palettegen=max_colors=${COLORES}:reserve_transparent=1:stats_mode=full" \
    "$TMP/paleta.png"

ffmpeg -nostdin -v error -y -i "$TMP/in/%04d.png" -i "$TMP/paleta.png" \
    -filter_complex "[0:v]format=rgba,${RECORTE}${ESCALA}[a];[a][1:v]paletteuse=dither=none:alpha_threshold=128" \
    "$TMP/out/%04d.png"

# -d 41 son los 41 ms del fotograma a 24 fps. img2webp funde por su cuenta los
# que salen idénticos, así que la animación "a dos" se queda en la mitad.
img2webp -loop 0 -d 41 -lossless "$TMP/out"/*.png -o "$SALIDA" >/dev/null

echo "→ $SALIDA · $(du -h "$SALIDA" | cut -f1) · $(webpmux -info "$SALIDA" | grep -o 'Number of frames: [0-9]*')"

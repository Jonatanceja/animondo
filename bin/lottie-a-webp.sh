#!/bin/bash
#
# Convierte un .lottie hecho de secuencia de imágenes en un WebP animado.
#
#   bin/lottie-a-webp.sh unicornio.lottie          [alto|nativo] [colores|bn] [--recortar]
#   bin/lottie-a-webp.sh "PARTE UNO/"               [alto] [colores] [--recortar]
#
# Acepta un .lottie o la carpeta que escupe Bodymovin (data.json + images/).
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

[ -n "$IN" ] && [ -e "$IN" ] || { echo "uso: $0 (archivo.lottie | carpeta/) [alto] [colores] [--recortar]" >&2; exit 1; }
for cmd in ffmpeg ffprobe img2webp webpmux unzip; do
    command -v "$cmd" >/dev/null || { echo "falta $cmd (brew install ffmpeg webp)" >&2; exit 1; }
done

BASE=$(basename "${IN%/}" .lottie)
SALIDA="$(dirname "${IN%/}")/$BASE.webp"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/in" "$TMP/out"

if [ -d "$IN" ]; then
    ORIGEN="$IN/images"
    [ -d "$ORIGEN" ] || { echo "la carpeta no tiene images/" >&2; exit 1; }
else
    unzip -q "$IN" -d "$TMP/x"
    ORIGEN=$(dirname "$(find "$TMP/x" \( -name '*.png' -o -name '*.jpg' \) | head -1)")
    [ -d "$ORIGEN" ] || { echo "no trae secuencia de imágenes: es vectorial, déjalo como está" >&2; exit 1; }
fi

# Los fotogramas se llaman imgSeq_N.png o seq_0_N.png y el número no va
# rellenado con ceros, así que hay que ordenarlos numéricamente y renumerarlos
# a un patrón fijo.
#
# Se reescriben TODOS a PNG rgba, no sólo los JPG. La exportación mezcla los dos
# formatos —los fotogramas sin nada transparente salen en JPG— y además los PNG
# vienen en paleta. Al leer la secuencia, ffmpeg fija el formato con el primer
# fotograma y revienta con un "Internal bug" en cuanto cambia a mitad de camino.
n=0
while IFS= read -r f; do
    printf -v destino "$TMP/in/%04d.png" "$n"
    ffmpeg -nostdin -v error -y -i "$f" -pix_fmt rgba "$destino"
    n=$((n + 1))
done < <(find "$ORIGEN" \( -name '*.png' -o -name '*.jpg' \) | sed 's/.*_\([0-9]*\)\.[a-z]*$/\1 &/' | sort -n | cut -d' ' -f2-)

DIMS=$(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$TMP/in/0000.png")
ANCHO_ORIG=${DIMS%%,*}
ALTO_ORIG=${DIMS##*,}
echo "$n fotogramas · $DIMS"

RECORTE=""
if [ "$RECORTAR" = "--recortar" ]; then
    # El recuadro que ocupa el dibujo, uniendo el de cada fotograma.
    #
    # `limit=0` y no el 0.02 de por defecto: con umbral, cropdetect descarta los
    # píxeles de borde suave y se come lo fino —un cuerno, una antena—, que es
    # justo lo que sobresale del dibujo. Y `reset=1` para medir fotograma a
    # fotograma y quedarnos con la unión: en modo acumulado converge a un
    # recuadro más corto que el real, y si la escena gira, lo que asoma en un
    # fotograma no está en el siguiente.
    CROP=$(ffmpeg -nostdin -v info -i "$TMP/in/%04d.png" \
        -vf "format=rgba,alphaextract,cropdetect=limit=0:round=2:reset=1" -f null - 2>&1 \
        | grep -o "x1:[0-9-]* x2:[0-9-]* y1:[0-9-]* y2:[0-9-]*" \
        | awk -v W="$ANCHO_ORIG" -v H="$ALTO_ORIG" '
            {for (i = 1; i <= NF; i++) { split($i, a, ":"); v[a[1]] = a[2] }
             if (x1 == "" || v["x1"] < x1) x1 = v["x1"]
             if (v["x2"] > x2) x2 = v["x2"]
             if (y1 == "" || v["y1"] < y1) y1 = v["y1"]
             if (v["y2"] > y2) y2 = v["y2"]}
            END {
              # Un par de píxeles de respiro, sin salirse del lienzo.
              m = 2
              x1 = (x1 - m < 0 ? 0 : x1 - m); y1 = (y1 - m < 0 ? 0 : y1 - m)
              x2 = (x2 + m > W - 1 ? W - 1 : x2 + m); y2 = (y2 + m > H - 1 ? H - 1 : y2 + m)
              # El ancho par lo piden los códecs de croma submuestreado.
              w = x2 - x1 + 1; h = y2 - y1 + 1
              w = w - (w % 2); h = h - (h % 2)
              printf "%d:%d:%d:%d", w, h, x1, y1}')
    [ -n "$CROP" ] || { echo "no se pudo medir el recorte" >&2; exit 1; }
    echo "recorte: $CROP"
    RECORTE="crop=${CROP},"
fi

# Con `nativo` no se toca el tamaño. Sirve para material que ya viene pequeño:
# pedirle una altura mayor que la suya sólo lo ampliaría sin añadir detalle.
if [ "$ALTO" = "nativo" ]; then
    ESCALA="null"
else
    ESCALA="scale=-2:${ALTO}:flags=lanczos"
fi

# Paleta única para toda la secuencia: si se calcula por fotograma, los colores
# bailan entre uno y otro. Sin dithering, que en dibujo de línea sólo es ruido
# y además le arruina la compresión al WebP.
#
# Con COLORES=bn se impone una paleta de blanco y negro puros en vez de dejar
# que ffmpeg la deduzca. Con pocos colores, el promedio que elige tira a verdoso
# y los blancos del dibujo salen sucios; imponerla cuesta un 15% más de peso y
# el dibujo queda limpio. Sólo vale para line art en blanco y negro: si la
# escena lleva algo de color, hay que darle un número.
if [ "$COLORES" = "bn" ]; then
    python3 - "$TMP/paleta.png" <<'PALETA'
import struct, zlib, sys
# RGBA, no RGB: la última entrada tiene que ser transparente o `paletteuse`
# pinta de gris todo lo que debería dejar ver el fondo.
base = [(0, 0, 0, 255), (255, 255, 255, 255), (96, 96, 96, 255), (176, 176, 176, 255)]
cols = [base[i % len(base)] for i in range(255)] + [(0, 0, 0, 0)]
raw = b''.join(b'\x00' + b''.join(struct.pack('BBBB', *cols[y * 16 + x]) for x in range(16)) for y in range(16))
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 16, 16, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
open(sys.argv[1], 'wb').write(png)
PALETA
else
ffmpeg -nostdin -v error -y -i "$TMP/in/%04d.png" \
    -vf "format=rgba,${RECORTE}${ESCALA},palettegen=max_colors=${COLORES}:reserve_transparent=1:stats_mode=full" \
    "$TMP/paleta.png"
fi

ffmpeg -nostdin -v error -y -i "$TMP/in/%04d.png" -i "$TMP/paleta.png" \
    -filter_complex "[0:v]format=rgba,${RECORTE}${ESCALA}[a];[a][1:v]paletteuse=dither=none:alpha_threshold=128" \
    "$TMP/out/%04d.png"

# -d 41 son los 41 ms del fotograma a 24 fps. img2webp funde por su cuenta los
# que salen idénticos, así que la animación "a dos" se queda en la mitad.
img2webp -loop 0 -d 41 -lossless "$TMP/out"/*.png -o "$SALIDA" >/dev/null

echo "→ $SALIDA · $(du -h "$SALIDA" | cut -f1) · $(webpmux -info "$SALIDA" | grep -o 'Number of frames: [0-9]*')"

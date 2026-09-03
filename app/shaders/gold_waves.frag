#version 460 core
precision highp float;

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Далайн долгион: 4 давхар синус (далайц, чиглэл, хурд)
float waveH(vec2 p, float t) {
    return 0.34 * sin(1.00 * p.x + 0.60 * p.y + 0.50 * t)
         + 0.26 * sin(0.44 * p.x - 0.90 * p.y + 0.38 * t)
         + 0.12 * sin(2.00 * p.x + 1.60 * p.y + 0.70 * t)
         + 0.07 * sin(0.20 * p.x + 3.40 * p.y - 0.55 * t);
}

vec2 waveG(vec2 p, float t) {
    vec2 g = vec2(0.0);
    g += 0.34 * cos(1.00 * p.x + 0.60 * p.y + 0.50 * t) * vec2(1.00, 0.60);
    g += 0.26 * cos(0.44 * p.x - 0.90 * p.y + 0.38 * t) * vec2(0.44, -0.90);
    g += 0.12 * cos(2.00 * p.x + 1.60 * p.y + 0.70 * t) * vec2(2.00, 1.60);
    g += 0.07 * cos(0.20 * p.x + 3.40 * p.y - 0.55 * t) * vec2(0.20, 3.40);
    return g;
}

void main() {
    vec2 uv = FlutterFragCoord().xy / uSize;
    float aspect = uSize.x / uSize.y;
    float t = uTime;

    // Дэлгэцийн координат (y дээшээ)
    float sx = (uv.x - 0.5) * 2.0 * aspect;
    float sy = (0.5 - uv.y) * 2.0;
    float fov = 0.62;

    // Камер: гадаргууд ойрхон, эгц доош хазайсан тул алсын хаяа харагдахгүй
    float camH = 2.4;
    float pitch = -1.00;
    vec3 fwd = vec3(0.0, sin(pitch), cos(pitch));
    vec3 rightV = vec3(1.0, 0.0, 0.0);
    vec3 upV = vec3(0.0, cos(pitch), -sin(pitch));
    vec3 rd = normalize(fwd + sx * fov * rightV + sy * fov * upV);
    rd.y = min(rd.y, -0.06); // тэнгэрийн хаяанаас дээш гарахгүй

    // Туяаг долгионт гадаргуутай огтлолцуулна (алсын долгион сааран намдана)
    float dist = camH / (-rd.y);
    float att;
    for (int i = 0; i < 6; i++) {
        vec2 hp = vec2(rd.x, rd.z) * dist;
        att = 1.0 / (1.0 + dist * 0.02);
        float hgt = waveH(hp, t) * att;
        float newDist = (camH - hgt) / (-rd.y);
        dist = clamp(dist * 0.35 + newDist * 0.65, 0.5, 80.0);
    }
    vec2 pos = vec2(rd.x, rd.z) * dist;
    att = 1.0 / (1.0 + dist * 0.02);
    vec2 grad = waveG(pos, t) * att;

    // Дэлхийн координат дахь хавтангийн тор
    float tile = 0.20;
    vec2 g = pos / tile;
    vec2 cell = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 d = abs(f);
    float edge = max(d.x, d.y);

    // Пикселийн мөр алслах ба налуу өнцгөөр томорно — алсын хавтан зөөлөрч бүдгэрнэ
    float aa = clamp(dist * 1.6 * fov / (uSize.y * tile) / max(-rd.y, 0.12),
                     0.004, 0.45);
    float gridVis = smoothstep(0.60, 0.20, aa);

    float gapW = 0.045;
    float bevelStart = 0.36;
    float gapMask = smoothstep(0.5 - gapW - aa, 0.5 - gapW + aa, edge) * gridVis;
    float bevelT = smoothstep(bevelStart, 0.5 - gapW, edge) * gridVis;

    vec2 bevelDir = (d.x > d.y) ? vec2(sign(f.x), 0.0) : vec2(0.0, sign(f.y));
    vec2 jitter = (vec2(hash(cell), hash(cell + 57.0)) - 0.5) * 0.10 * gridVis;

    // Дэлхийн координат дахь normal (y дээшээ)
    vec2 nxz = -grad + jitter + bevelDir * bevelT * 1.5;
    vec3 n = normalize(vec3(nxz.x, 1.6, nxz.y));

    // Нар зүүн урдаас налуу тусна
    vec3 l1 = normalize(vec3(-0.42, 0.58, 0.68));
    vec3 v = -rd;
    vec3 h1 = normalize(l1 + v);

    float ndl = clamp(dot(n, l1), 0.0, 1.0);
    float ndh = clamp(dot(n, h1), 0.0, 1.0);
    float diff = pow(ndl, 1.55);
    float specBroad = pow(ndh, 20.0);
    float specTight = pow(ndh, 140.0);
    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);

    // Долгионы хөндийд сүүдэрлэж, оройд нь гийнэ
    float hgt2 = waveH(pos, t) * att;
    float ao = 0.44 + 0.56 * smoothstep(-1.3, 1.3, hgt2);
    float tileVar = 0.94 + 0.12 * hash(cell + 13.0) * gridVis;

    float L = (0.055 + diff * 0.66 + specBroad * 0.90 + fres * 0.16) * ao * tileVar
            + specTight * 0.95;

    // Алтны өнгөний шат: харанхуй хүрнээс цагаан алт хүртэл
    vec3 cDark = vec3(0.085, 0.048, 0.014);
    vec3 cMid = vec3(0.80, 0.55, 0.16);
    vec3 cHi = vec3(1.00, 0.90, 0.55);
    vec3 cWhite = vec3(1.00, 0.98, 0.88);
    vec3 col = mix(cDark, cMid, smoothstep(0.02, 0.62, L));
    col = mix(col, cHi, smoothstep(0.50, 0.90, L));
    col = mix(col, cWhite, smoothstep(0.90, 1.25, L));

    // Хавтан хоорондын завсар: гэрэлтэй хэсэгт улбар шар, сүүдэрт хар
    vec3 waveN = normalize(vec3(-grad.x, 1.6, -grad.y));
    float gapL = clamp(dot(waveN, l1), 0.0, 1.0) * ao;
    vec3 gapCol = mix(vec3(0.05, 0.025, 0.008), vec3(0.62, 0.36, 0.08),
                      smoothstep(0.15, 0.9, gapL));
    col = mix(col, gapCol, gapMask);

    // Алслах тусам гүн хүрэл манан руу уусна
    float fog = exp(-max(dist - 2.5, 0.0) * 0.012);
    col = mix(vec3(0.13, 0.075, 0.028), col, fog);

    fragColor = vec4(col, 1.0);
}

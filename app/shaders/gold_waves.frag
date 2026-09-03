#version 460 core
precision highp float;

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Гадаргууг бүхэлд нь аажим давалгаалуулах гөлгөр долгион
float waveH(vec2 p, float t) {
    float h = 0.0;
    h += sin(p.x * 1.10 + p.y * 0.60 + t * 0.30) * 0.55;
    h += sin(p.x * 0.50 - p.y * 1.30 + t * 0.21) * 0.45;
    h += sin(p.x * 2.10 + p.y * 1.70 - t * 0.16) * 0.20;
    h += sin(p.y * 2.60 - t * 0.12) * 0.12;
    return h;
}

void main() {
    vec2 uv = FlutterFragCoord().xy / uSize;
    float aspect = uSize.x / uSize.y;
    float t = uTime;

    // Долгионы өндөр ба налуу
    vec2 wp = vec2(uv.x * aspect, uv.y * 1.4) * 2.6;
    float h = waveH(wp, t);
    float e = 0.02;
    vec2 grad = vec2(waveH(wp + vec2(e, 0.0), t) - h,
                     waveH(wp + vec2(0.0, e), t) - h) / e;

    // Perspective: дээшлэх тусам хавтангууд холдож жижгэрнэ
    float zFar = 0.45;
    float zNear = 1.30;
    float z = mix(zFar, zNear, uv.y);
    float gridN = 22.0;
    // y-тэнхлэгт 1/z-ийн интегралыг ашигласнаар хавтан яг дөрвөлжин хэвээр үлдэнэ
    vec2 g = vec2(uv.x * aspect * gridN / z,
                  gridN * log(z / zFar) / (zNear - zFar));

    // Торыг долгионы налуугаар мушгиж, эгнээнүүд давалгааг дагаж мурийна
    g += grad * 0.55;

    vec2 cell = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 d = abs(f);
    float edge = max(d.x, d.y);

    // Ирмэгийн зөөлрүүлэлт (нэг пикселийн өргөнөөр)
    float aa = 1.5 * gridN / (z * uSize.y);
    float gapW = 0.035;
    float bevelStart = 0.38;

    float gapMask = smoothstep(0.5 - gapW - aa, 0.5 - gapW + aa, edge);
    float bevelT = smoothstep(bevelStart, 0.5 - gapW, edge);

    // Normal: долгионы налуу + ирмэгийн налуу + хавтан бүрийн бага зэргийн хэлбийлт
    vec2 bevelDir = (d.x > d.y) ? vec2(sign(f.x), 0.0) : vec2(0.0, sign(f.y));
    vec2 jitter = (vec2(hash(cell), hash(cell + 57.0)) - 0.5) * 0.10;
    vec2 nxy = -grad * 0.80 + jitter + bevelDir * bevelT * 1.3;
    vec3 n = normalize(vec3(nxy, 1.0));

    // Гэрэлтүүлэг: зүүн дээрээс гол гэрэл, зүүн доороос дулаан нэмэлт гэрэл
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 l1 = normalize(vec3(-0.35, -0.50, 0.75));
    vec3 l2 = normalize(vec3(-0.55, 0.65, 0.55));
    vec3 h1 = normalize(l1 + viewDir);
    vec3 h2 = normalize(l2 + viewDir);

    float diff = pow(clamp(dot(n, l1), 0.0, 1.0)
                   + clamp(dot(n, l2), 0.0, 1.0) * 0.35, 1.6);
    float ndh1 = clamp(dot(n, h1), 0.0, 1.0);
    float ndh2 = clamp(dot(n, h2), 0.0, 1.0);
    float specBroad = pow(ndh1, 24.0) + pow(ndh2, 24.0) * 0.5;
    float specTight = pow(ndh1, 120.0) + pow(ndh2, 120.0) * 0.5;

    // Долгионы хөндийд сүүдэрлэж, оройд нь гийнэ
    float ao = 0.42 + 0.58 * smoothstep(-1.4, 1.4, h);

    // Хавтан бүрийн өнгөний бага зэргийн ялгаа
    float tileVar = 0.93 + 0.14 * hash(cell + 13.0);

    float L = (0.03 + diff * 0.60 + specBroad * 0.90) * ao * tileVar
            + specTight * 0.9;

    // Алтны өнгөний шат: харанхуй хүрнээс цагаан алт хүртэл
    vec3 cDark = vec3(0.09, 0.050, 0.015);
    vec3 cMid = vec3(0.80, 0.550, 0.160);
    vec3 cHi = vec3(1.00, 0.900, 0.550);
    vec3 cWhite = vec3(1.00, 0.980, 0.880);
    vec3 col = mix(cDark, cMid, smoothstep(0.02, 0.62, L));
    col = mix(col, cHi, smoothstep(0.50, 0.90, L));
    col = mix(col, cWhite, smoothstep(0.90, 1.25, L));

    // Хавтан хоорондын завсар: гэрэлтэй хэсэгт улбар шар, сүүдэрт хар
    vec3 waveN = normalize(vec3(-grad * 0.80, 1.0));
    float gapL = clamp(dot(waveN, l1), 0.0, 1.0) * ao;
    vec3 gapCol = mix(vec3(0.05, 0.025, 0.008), vec3(0.62, 0.36, 0.08),
                      smoothstep(0.15, 0.9, gapL));
    col = mix(col, gapCol, gapMask);

    fragColor = vec4(col, 1.0);
}

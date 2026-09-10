#version 460 core
precision highp float;

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;
uniform float uTiltX;
uniform float uTiltY;
uniform float uMotion;
uniform sampler2D uIcon;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 frag = FlutterFragCoord().xy;
    vec2 uv = frag / uSize;
    vec2 p = (uv - 0.5) * 2.0;           // -1..1
    float r = length(p);
    // Дугуйгаас гадна тунгалаг (зөөлөн ирмэг)
    float alpha = 1.0 - smoothstep(0.985, 1.0, r);
    if (alpha <= 0.0) {
        fragColor = vec4(0.0);
        return;
    }

    float tx = clamp(uTiltX, -1.0, 1.0) + sin(uTime * 0.31) * 0.02;
    float ty = clamp(uTiltY, -1.0, 1.0) + cos(uTime * 0.23) * 0.02;
    float mo = clamp(uMotion, 0.0, 1.0);

    vec3 V = normalize(vec3(-tx * 0.9, -ty * 0.9, 1.0));
    vec3 L1 = normalize(vec3(-0.38, -0.48, 0.92));
    vec3 Hh = normalize(L1 + V);

    // Бага зэрэг гүдгэр (дом) гадаргуу
    vec3 N = normalize(vec3(p * 0.35, 1.0));
    float ndl = clamp(dot(N, L1), 0.0, 1.0);

    // Хоёр давхар нарийн ширхэгтэй шижир алт (картын glitter бүстэй ижил)
    vec2 gcell = floor(frag * 2.2);
    vec2 mcell = floor(frag * 3.6 + 13.0);
    float g1 = hash(gcell);
    float g2 = hash(gcell + 7.3);
    float g3 = hash(gcell + 11.0);
    float m1 = hash(mcell);
    float m2 = hash(mcell + 5.1);
    vec3 gn = normalize(vec3((vec2(g1, g2) - 0.5) * 1.4 + p * 0.35, 1.0));
    vec3 mn = normalize(vec3((vec2(m1, m2) - 0.5) * 1.6 + p * 0.35, 1.0));
    float gd = clamp(dot(gn, L1), 0.0, 1.0);
    float gs = pow(clamp(dot(gn, Hh), 0.0, 1.0), 18.0)
             * (0.7 + 0.3 * sin(uTime * 2.5 + g1 * 40.0));
    float ms = pow(clamp(dot(mn, Hh), 0.0, 1.0), 26.0)
             * (0.6 + 0.4 * sin(uTime * 3.1 + m1 * 50.0));
    vec3 col = mix(vec3(0.52, 0.34, 0.07), vec3(0.98, 0.78, 0.28), 0.35 + 0.65 * gd);
    col *= 0.84 + 0.28 * g3 + 0.10 * (m1 - 0.5);
    col *= 0.85 + 0.35 * ndl;                       // домын гэрэл сүүдэр
    col += vec3(1.00, 0.92, 0.60) * (gs * 0.9 + ms * 0.7) * (1.0 + mo * 0.5) * (0.5 + 0.5 * g3);

    // Хазайлтыг дагаж гүйх гялбааны туяа + анивчих ширхэгүүд
    float band = (uv.x * 0.8 + uv.y * 0.6) - (0.7 + tx * 0.9 - ty * 0.6);
    float shimmer = exp(-band * band / 0.05);
    float flicker = 0.5 + 0.5 * sin(uTime * (4.0 + mo * 6.0) + g1 * 60.0 + m1 * 30.0);
    float sparkleGrain = step(0.80, g3) * (0.4 + 0.6 * flicker);
    col += vec3(1.00, 0.95, 0.72) * shimmer * (0.10 + 0.9 * sparkleGrain) * (0.6 + mo * 0.9);

    // Сийлсэн icon — glitter дунд тод харагдахаар: ёроол нь гөлгөр гүн алт,
    // өргөн налуу ханатай, гэрэлтэй ирмэг, эргэн тойрондоо зөөлөн сүүдэр
    vec2 iuv = ((p + vec2(0.0, 0.10)) / 0.66) * 0.5 + 0.5; // товчны 66%, бага зэрэг дээш
    if (iuv.x > 0.0 && iuv.x < 1.0 && iuv.y > 0.0 && iuv.y < 1.0) {
        float e = 0.028;
        float a0 = texture(uIcon, iuv).a;
        float axp = texture(uIcon, iuv + vec2(e, 0.0)).a;
        float axm = texture(uIcon, iuv - vec2(e, 0.0)).a;
        float ayp = texture(uIcon, iuv + vec2(0.0, e)).a;
        float aym = texture(uIcon, iuv - vec2(0.0, e)).a;
        vec2 grad = vec2(axp - axm, ayp - aym);
        float edge = clamp(length(grad) * 1.3, 0.0, 1.0);
        float shade = dot(grad, normalize(vec2(-0.7, -0.7))) * 1.5;
        // Эргэн тойрны зөөлөн сүүдэр (halo) — icon-ийг ширхэгээс тусгаарлана
        float halo = max(max(axp, axm), max(ayp, aym));
        col *= 1.0 - clamp(halo - a0, 0.0, 1.0) * 0.35;
        vec3 warm = vec3(1.00, 0.88, 0.50);
        vec3 fl = normalize(N + vec3(0.22, 0.14, 0.0));
        float floorGlare = pow(clamp(dot(fl, Hh), 0.0, 1.0), 20.0);
        // Ёроол: гөлгөр гүн алт (glitter-гүй), өөрийн тусгалтай
        vec3 floorCol = vec3(0.46, 0.28, 0.05) * (0.75 + 0.45 * ndl)
                      + warm * floorGlare * 0.55;
        col = mix(col, floorCol, a0);
        col *= 1.0 - edge * 0.30;
        col += warm * clamp(shade, 0.0, 1.0) * 1.1;
        col -= vec3(0.30, 0.22, 0.08) * clamp(-shade, 0.0, 1.0);
    }

    // Захын нарийн гялалзсан rim — гэрэл тусах талд тод
    float rim = exp(-pow((r - 0.965) / 0.022, 2.0));
    vec2 rimL = normalize(vec2(-0.7 - tx * 0.6, -0.7 - ty * 0.6));
    float rimLit = dot(normalize(p + vec2(1e-4)), rimL);
    vec3 rimCol = mix(vec3(0.55, 0.35, 0.08), vec3(1.00, 0.92, 0.58),
                      0.30 + 0.70 * smoothstep(-0.7, 1.0, rimLit));
    col = mix(col, rimCol, rim);

    col = col / (1.0 + col * 0.18);
    col *= vec3(1.00, 0.965, 0.82);
    fragColor = vec4(clamp(col, 0.0, 1.0) * alpha, alpha);
}

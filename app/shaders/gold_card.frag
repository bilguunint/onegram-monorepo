#version 460 core
precision highp float;

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;
uniform float uTiltX;
uniform float uTiltY;
uniform float uLogoAspect;
uniform float uMotion;
uniform float uTextAspect;
uniform sampler2D uLogo;
uniform sampler2D uText;
uniform sampler2D uChart;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Зөөлөн том муруйлт — нэг гэрлийн дор гэрэлт цөөрөм үүсгэнэ
float bigWave(vec2 p) {
    return sin(p.x * 2.1 + 0.6 * sin(p.y * 1.7)) * 0.55
         + cos(p.y * 2.4 + 0.5 * sin(p.x * 1.5)) * 0.45;
}

void main() {
    vec2 uv = FlutterFragCoord().xy / uSize;
    float aspect = uSize.x / uSize.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    float tx = clamp(uTiltX, -1.0, 1.0) + sin(uTime * 0.31) * 0.02;
    float ty = clamp(uTiltY, -1.0, 1.0) + cos(uTime * 0.23) * 0.02;
    float mo = clamp(uMotion, 0.0, 1.0);

    // Үзэгчийн чиглэл: картын байрлал (perspective) + утасны хазайлт
    vec3 V = normalize(vec3(-(p.x - aspect * 0.5) * 0.9 - tx * 0.95,
                            -(p.y - 0.5) * 0.9 - ty * 0.95, 1.0));

    // Ирмэгийн бөөрөнхий налуу (fillet) — бөөрөнхий тэгш өнцөгтийн signed distance
    vec2 frag0 = FlutterFragCoord().xy;
    float radius = 20.0;
    vec2 half_ = uSize * 0.5;
    vec2 rel = frag0 - half_;
    vec2 q = abs(rel) - (half_ - radius);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius; // <0 дотор
    vec2 edgeN = (max(q.x, q.y) > 0.0)
        ? normalize(max(q, 0.0)) * sign(rel)
        : ((q.x > q.y) ? vec2(sign(rel.x), 0.0) : vec2(0.0, sign(rel.y)));
    // Захын маш зөөлөн налуу: нарийн, бага налуутай — цэвэрхэн гэрэл сүүдрийн шилжилт
    float bevelW = 8.0;
    float tb = clamp(-sd / bevelW, 0.0, 1.0);            // 0 = ирмэг, 1 = нүүр
    float sb = 1.0 - tb;
    float slope = sb * sb;                               // зөөлөн профиль
    vec2 rimN = vec2(0.0); // ирмэггүй — бүрэн тэгш нүүр

    // Normal: том долгион + бичил долгион + ирмэгийн налуу
    float e = 0.01;
    vec2 wg = vec2(bigWave(p + vec2(e, 0.0)) - bigWave(p - vec2(e, 0.0)),
                   bigWave(p + vec2(0.0, e)) - bigWave(p - vec2(0.0, e))) / (2.0 * e) * 0.05;
    // Өнгөлсөн гөлгөр гадаргуу: маш бага зэргийн бичил долгион л үлдээнэ
    vec2 pn = (vec2(vnoise(p * 6.0), vnoise(p * 6.0 + 3.0)) - 0.5) * 0.012;
    vec3 N = normalize(vec3(-wg.x + pn.x + rimN.x, -wg.y + pn.y + rimN.y, 1.0));

    // Нэг нар (дээд зүүнээс) — Blinn-Phong; сул fill гэрэл эсрэг талаас
    vec3 L1 = normalize(vec3(-0.38, -0.48, 0.92));
    vec3 L2 = normalize(vec3(0.6, 0.5, 0.7));
    vec3 Hh = normalize(L1 + V);
    float ndl = clamp(dot(N, L1), 0.0, 1.0);
    float ndl2 = clamp(dot(N, L2), 0.0, 1.0);
    float ndh = clamp(dot(N, Hh), 0.0, 1.0);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float diff = pow(ndl, 1.55);
    float specB = pow(ndh, 9.0) * (1.0 + mo * 0.30);
    float specT = pow(ndh, 90.0) * (1.0 + mo * 0.4);
    float fres = pow(1.0 - ndv, 3.0);
    float ao = 0.68 + 0.32 * smoothstep(-1.0, 1.0, bigWave(p));
    float Lm = (0.16 + diff * 0.48 + ndl2 * 0.10 + specB * 0.22 + fres * 0.06)
             * ao + specT * 0.08;

    // Алтны өнгөний шат: гүн амбер → баялаг алт → цайвар алт (цагаан хүрэхгүй)
    vec3 cDark = vec3(0.20, 0.12, 0.03);
    vec3 cMid = vec3(0.86, 0.61, 0.13);
    vec3 cHi = vec3(1.00, 0.87, 0.38);
    vec3 col = mix(cDark, cMid, smoothstep(0.02, 0.60, Lm));
    col = mix(col, cHi, smoothstep(0.60, 1.15, Lm));

    // Жинхэнэ алтны материал: алтан Fresnel + орчны тусгал
    vec3 goldF0 = vec3(1.00, 0.71, 0.29);
    vec3 R = 2.0 * dot(N, V) * N - V;
    // Өрөөний тусгал: дээр гэрэлтэй зурвас, дунд бараан, доор нарийн гэрэлтэй зурвас
    float ry = -R.y;
    float envBand = smoothstep(-0.35, 0.55, ry) * 0.85
                  + 0.45 * exp(-pow((ry + 0.45) / 0.10, 2.0))
                  - 0.32 * exp(-pow((ry - 0.05) / 0.16, 2.0));
    float sunRef = pow(clamp(dot(R, L1), 0.0, 1.0), 8.0);
    vec3 envCol = mix(vec3(0.22, 0.13, 0.03), vec3(0.96, 0.76, 0.30), clamp(envBand, 0.0, 1.0))
                + vec3(1.00, 0.82, 0.42) * sunRef * 0.25;
    vec3 F = goldF0 + (1.0 - goldF0) * pow(1.0 - ndv, 5.0);
    col += F * envCol * 0.38 * ao * ao;
    vec3 warm = vec3(1.00, 0.86, 0.46);
    col += warm * specB * 0.12 * ao;
    col += vec3(1.00, 0.88, 0.55) * specT * 0.10;

    float specN = clamp(specB, 0.0, 1.0);
    // Нарийн brushed мөхлөг (зураг дээрх гадаргуу шиг, маш зөөлөн)
    col *= 0.975 + 0.05 * vnoise(vec2(p.y * uSize.y * 0.6, p.x * 1.5))
                 + 0.02 * (hash(floor(frag0 * 0.5)) - 0.5);

    // Holo: гялбааны захаар нимгэн хальсны маш бүдэг солонго
    float phase = ndv * 8.0 + p.x * 9.0 - p.y * 7.0 + (tx - ty) * 6.0;
    vec3 rainbow = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
    col += rainbow * vec3(1.0, 0.8, 0.5) * specN * (1.0 - specN) * (0.04 + mo * 0.03);

    // Сийлсэн лого — alpha маскаас налуу гаргаж ханануудыг гэрэлтүүлнэ
    vec2 logoSize = vec2(uSize.x * 0.40, uSize.x * 0.40 / uLogoAspect);
    vec2 logoCenter = vec2(uSize.x - 22.0 - logoSize.x * 0.5, uSize.y * 0.30);
    vec2 luv = (frag0 - (logoCenter - logoSize * 0.5)) / logoSize;
    if (luv.x > 0.0 && luv.x < 1.0 && luv.y > 0.0 && luv.y < 1.0) {
        float el = 0.006;
        float a0 = texture(uLogo, luv).a;
        float ax = texture(uLogo, luv + vec2(el, 0.0)).a - texture(uLogo, luv - vec2(el, 0.0)).a;
        float ay = texture(uLogo, luv + vec2(0.0, el)).a - texture(uLogo, luv - vec2(0.0, el)).a;
        vec2 grad = vec2(ax, ay);
        float edgeM = clamp(length(grad) * 1.6, 0.0, 1.0);
        float shade = dot(grad, normalize(vec2(-0.7, -0.7))) * 1.6;
        // Сийлсэн ёроол: бага зэрэг харанхуй, налуу нь өөр тул гэрлийг өөр агшинд ойлгоно
        vec3 nFloor = normalize(N + vec3(0.22, 0.14, 0.0));
        float floorGlare = pow(clamp(dot(nFloor, Hh), 0.0, 1.0), 24.0);
        vec3 floorCol = col * 0.78 + warm * floorGlare * 0.35 + rainbow * 0.03 * specN;
        col = mix(col, floorCol, a0);
        col *= 1.0 - edgeM * 0.22;
        col += warm * clamp(shade, 0.0, 1.0) * (0.40 + 0.7 * specN);
        col -= vec3(0.35, 0.25, 0.10) * clamp(-shade, 0.0, 1.0);
    }

    // Сийлсэн үлдэгдэл (текст) — логотой ижил аргаар, зүүн дээд хэсэгт
    vec2 textSize = vec2(70.0 * uTextAspect, 70.0);
    vec2 textOrigin = vec2(20.0, 18.0);
    vec2 tuv = (frag0 - textOrigin) / textSize;
    if (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) {
        float et = 0.006;
        float b0 = texture(uText, tuv).a;
        float bx = texture(uText, tuv + vec2(et, 0.0)).a - texture(uText, tuv - vec2(et, 0.0)).a;
        float by = texture(uText, tuv + vec2(0.0, et)).a - texture(uText, tuv - vec2(0.0, et)).a;
        vec2 tg = vec2(bx, by);
        float tEdge = clamp(length(tg) * 1.6, 0.0, 1.0);
        float tShade = dot(tg, normalize(vec2(-0.7, -0.7))) * 1.6;
        vec3 tFloorN = normalize(N + vec3(0.22, 0.14, 0.0));
        float tFloorGlare = pow(clamp(dot(tFloorN, Hh), 0.0, 1.0), 24.0);
        vec3 tFloor = col * 0.72 + warm * tFloorGlare * 0.35;
        col = mix(col, tFloor, b0);
        col *= 1.0 - tEdge * 0.25;
        col += warm * clamp(tShade, 0.0, 1.0) * (0.45 + 0.7 * specN);
        col -= vec3(0.35, 0.25, 0.10) * clamp(-tShade, 0.0, 1.0);
    }


    // Ханшийн муруйн доод бүс: ширхэгтэй шижир алт (glitter) — ширхэг бүр
    // санамсаргүй налуутай тул хазайлт, гэрлээр гялтганаа нь хөдөлнө
    {
        vec2 cuv = frag0 / uSize;
        vec4 cm = texture(uChart, cuv);
        float fillM = clamp(cm.g - cm.r, 0.0, 1.0);
        if (fillM > 0.001) {
            // Хоёр давхар нарийн ширхэг: үндсэн (~0.45px) + бичил (~0.28px)
            vec2 gcell = floor(frag0 * 2.2);
            vec2 mcell = floor(frag0 * 3.6 + 13.0);
            float g1 = hash(gcell);
            float g2 = hash(gcell + 7.3);
            float g3 = hash(gcell + 11.0);
            float m1 = hash(mcell);
            float m2 = hash(mcell + 5.1);
            vec3 gn = normalize(vec3((vec2(g1, g2) - 0.5) * 1.4, 1.0));
            vec3 mn = normalize(vec3((vec2(m1, m2) - 0.5) * 1.6, 1.0));
            float gd = clamp(dot(gn, L1), 0.0, 1.0);
            float gs = pow(clamp(dot(gn, Hh), 0.0, 1.0), 18.0)
                     * (0.7 + 0.3 * sin(uTime * 2.5 + g1 * 40.0));
            float ms = pow(clamp(dot(mn, Hh), 0.0, 1.0), 26.0)
                     * (0.6 + 0.4 * sin(uTime * 3.1 + m1 * 50.0));
            vec3 glitter = mix(vec3(0.52, 0.34, 0.07), vec3(0.98, 0.78, 0.28),
                               0.35 + 0.65 * gd);
            glitter *= 0.84 + 0.28 * g3 + 0.10 * (m1 - 0.5);
            glitter += vec3(1.00, 0.92, 0.60) * (gs * 0.9 + ms * 0.7) * (1.0 + mo * 0.5)
                     * (0.5 + 0.5 * g3);
            col = mix(col, glitter, fillM * 0.92);
        }

        // Сийлсэн муруй (улаан суваг = зураас)
        float ec = 1.0 / 420.0;
        float c0 = cm.r;
        float cx = texture(uChart, cuv + vec2(ec, 0.0)).r - texture(uChart, cuv - vec2(ec, 0.0)).r;
        float cy = texture(uChart, cuv + vec2(0.0, ec)).r - texture(uChart, cuv - vec2(0.0, ec)).r;
        vec2 cg = vec2(cx, cy);
        float cEdge = clamp(length(cg) * 1.4, 0.0, 1.0);
        float cShade = dot(cg, normalize(vec2(-0.7, -0.7))) * 1.4;
        vec3 cFloorN = normalize(N + vec3(0.18, 0.12, 0.0));
        float cGlare = pow(clamp(dot(cFloorN, Hh), 0.0, 1.0), 24.0);
        vec3 cFloor = col * 0.70 + warm * cGlare * 0.30;
        col = mix(col, cFloor, c0);
        col *= 1.0 - cEdge * 0.22;
        col += warm * clamp(cShade, 0.0, 1.0) * (0.40 + 0.7 * specN);
        col -= vec3(0.35, 0.25, 0.10) * clamp(-cShade, 0.0, 1.0);
    }

    // Захын нарийн гялалзсан алтан зураас — гэрэл тусах талд тод, бусад хэсэгт гүн алт,
    // хазайхад гялбаа нь зураасын дагуу хөдөлнө (зөөлөн gradient rim)
    float rimMask = exp(-pow((-sd - 1.0) / 0.9, 2.0));
    vec2 rimL = normalize(vec2(-0.7 - tx * 0.6, -0.7 - ty * 0.6));
    float rimLit = dot(edgeN, rimL);
    float rimBase = 0.30 + 0.70 * smoothstep(-0.7, 1.0, rimLit);
    float rimHot = pow(max(rimLit, 0.0), 6.0);
    vec3 rimCol = mix(vec3(0.55, 0.35, 0.08), vec3(1.00, 0.90, 0.55), rimBase)
                + vec3(1.00, 0.96, 0.78) * rimHot * 0.35;
    col = mix(col, rimCol, rimMask);
    // Зураасны дотор талын нарийн зөөлөн сүүдэр — rim-ийг цэвэрхэн тодруулна
    col *= 1.0 - exp(-pow((-sd - 2.6) / 0.9, 2.0)) * 0.16;

    // Зөөлөн vignette
    vec2 dd = uv - 0.5;
    col *= 1.0 - dot(dd, dd) * 0.18;

    // Зөөлөн tonemap + алтан tint: хэзээ ч цагаан руу шатахгүй
    col = col / (1.0 + col * 0.18);
    col *= vec3(1.00, 0.965, 0.82);
    float lum = dot(col, vec3(0.30, 0.59, 0.11));
    col = clamp(lum + (col - lum) * 1.06, 0.0, 1.0);
    fragColor = vec4(col, 1.0);
}

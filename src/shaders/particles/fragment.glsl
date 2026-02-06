void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - 0.5);

    float radius = 0.5;
    float edge = 0.3;

    float alpha = 1.0 - smoothstep(radius - edge, radius, distanceToCenter);

    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(0.1, 0.2, 0.6, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
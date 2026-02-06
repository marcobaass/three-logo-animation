void main()
{
    vec2 uv = gl_PointCoord;
    float dist = length(uv - 0.5);
    float radius = 0.5;
    
    if (dist > radius) discard;
    
    float alpha = 1.0;
    gl_FragColor = vec4(0.1, 0.2, 0.6, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
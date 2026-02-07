uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uExplosion;
uniform float uWaveFreq;
uniform float uWaveAmp;
uniform float uExplosionStrength;

void main()
{
    // Radial ripple + stronger downward gravity
    float dist = length(position.xy);
    float waveAmp = 0.08;      // slightly reduced for less horizontal movement
    float gravityBias = -0.04;  // doubled: stronger downward drift

    float ripple = waveAmp * sin(dist * 3.0 - uTime * 0.8);
    float angle = atan(position.y, position.x);
    // Bias ripple toward Y: less horizontal, more vertical
    float offsetX = ripple * cos(angle) * 0.4;
    float offsetY = ripple * sin(angle) + gravityBias;

    vec3 pos = position + vec3(offsetX, offsetY, 0.0);

    vec2 randomDir = vec2(
        fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453),
        fract(sin(dot(pos.xy + 1.0, vec2(12.9898, 78.233))) * 43758.5453)
    );
    randomDir = normalize(randomDir * 2.0 - 1.0);
    float freq2 = 4.0;
    vec2 curveDir = vec2(
        sin(pos.x * freq2) * cos(pos.y),
        cos(pos.x) * sin(pos.y * freq2)
    );
    curveDir = normalize(curveDir + 0.001);
    vec2 blendedDir = normalize(randomDir + curveDir);
    pos.xy += blendedDir * uExplosion * uExplosionStrength;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
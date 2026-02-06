uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uExplosion;

void main()
{
    float waveFreq = 8.0;
    float waveAmp = 0.9;

    // Wavy band in Y (curves horizontally)
    float bandCenterY = sin(position.x * waveFreq - uTime * 0.6) * waveAmp;
    float distToBandY = position.y - bandCenterY;
    float concentrationY = exp(-distToBandY * distToBandY * 1.0);
    float pullStrengthY = 0.1;
    float offsetY = (bandCenterY - position.y) * concentrationY * pullStrengthY;

    // Wavy band in X (curves vertically)
    float bandCenterX = sin(position.y * waveFreq - uTime * 0.3) * waveAmp;
    float distToBandX = position.x - bandCenterX;
    float concentrationX = exp(-distToBandX * distToBandX * 6.0);
    float pullStrengthX = 0.2;
    float offsetX = (bandCenterX - position.x) * concentrationX * pullStrengthX;

    vec3 pos = position + vec3(offsetX, offsetY, 0.0);

    // Shatter: each particle moves in its own random direction (from position seed)
    float explosionStrength = 1.0;
    vec2 randomDir = vec2(
        fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453),
        fract(sin(dot(pos.xy + 1.0, vec2(12.9898, 78.233))) * 43758.5453)
    );
    randomDir = normalize(randomDir * 2.0 - 1.0);
    pos.xy += randomDir * uExplosion * explosionStrength;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
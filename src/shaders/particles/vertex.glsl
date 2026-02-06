uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uExplosion;
uniform float uWaveFreq;
uniform float uWaveAmp;

void main()
{
    // Option D: Original bands + curvature
    float bandCenterY = sin(position.x * uWaveFreq - uTime * 0.6) * uWaveAmp;
    float distToBandY = position.y - bandCenterY;
    float concentrationY = exp(-distToBandY * distToBandY * 1.0);
    float pullStrengthY = 0.1;
    float offsetY = (bandCenterY - position.y) * concentrationY * pullStrengthY;

    float bandCenterX = sin(position.y * uWaveFreq - uTime * 0.3) * uWaveAmp;
    float distToBandX = position.x - bandCenterX;
    float concentrationX = exp(-distToBandX * distToBandX * 6.0);
    float pullStrengthX = 0.2;
    float offsetX = (bandCenterX - position.x) * concentrationX * pullStrengthX;

    float curveX = sin(position.x) * cos(position.y) * 0.05;
    float curveY = cos(position.x) * sin(position.y) * 0.05;
    offsetX += curveX * sin(uTime);
    offsetY += curveY * cos(uTime);
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
    float explosionStrength = 1.0;
    pos.xy += blendedDir * uExplosion * explosionStrength;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
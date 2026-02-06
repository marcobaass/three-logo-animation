uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uExplosion;

void main()
{
    float waveFreq = 8.0;
    float waveAmp = 3.0;

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

    // Move particles outward from center
    float distFromCenter = length(pos.xy) + 0.0001;
    vec2 explosionDir = pos.xy / distFromCenter;
    float explosionStrength = 0.5;
    pos.xy += explosionDir * uExplosion * explosionStrength * distFromCenter;
    // (distFromCenter makes farther pixels move more; remove it for uniform spread)

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
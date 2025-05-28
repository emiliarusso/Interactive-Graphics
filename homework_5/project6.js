var raytraceFS = `
struct Ray {
    vec3 pos; // Ray position
    vec3 dir; // Ray direction
};

struct Material {
    vec3 k_d;   // Diffuse coefficient
    vec3 k_s;   // Specular coefficient
    float n;    // Specular exponent
};

struct Sphere {
    vec3 center; // Sphere center position
    float radius; // Sphere radius
    Material mtl; // Sphere material
};

struct Light {
    vec3 position; // Light position
    vec3 intensity; // Light intensity
};

struct HitInfo {
    float t; // Intersection distance along the ray
    vec3 position; // Intersection position
    vec3 normal; // Surface normal at the intersection point
    Material mtl; // Material of the intersected object
};

uniform Sphere spheres[NUM_SPHERES]; // Array of spheres
uniform Light lights[NUM_LIGHTS]; // Array of lights
uniform samplerCube envMap; // Environment map
uniform int bounceLimit; // Maximum number of ray bounces

// Function to check if a shadow ray intersects any object
bool IntersectShadowRay(Ray ray) {
    for (int i = 0; i < NUM_SPHERES; ++i) {
        Sphere sphere = spheres[i];
        vec3 oc = ray.pos - sphere.center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - sphere.radius * sphere.radius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float t = (-b - sqrt(discriminant)) / (2.0 * a);
            if (t > 0.0) {
                return true; // Shadow ray intersects an object
            }
        }
    }
    return false; // Shadow ray does not intersect any object
}

// Function to find the closest intersection of a ray with any object
bool IntersectRay(inout HitInfo hit, Ray ray) {
    hit.t = 1e30; // Initialize intersection distance to a large value
    bool foundHit = false; // Flag to indicate if an intersection is found

    for (int i = 0; i < NUM_SPHERES; ++i) {
        Sphere sphere = spheres[i];
        vec3 oc = ray.pos - sphere.center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - sphere.radius * sphere.radius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float t0 = (-b - sqrt(discriminant)) / (2.0 * a);
            if (t0 > 0.0 && t0 < hit.t) {
                hit.t = t0; // Update intersection distance
                hit.position = ray.pos + t0 * ray.dir; // Update intersection position
                hit.normal = normalize((hit.position - sphere.center) / sphere.radius); // Update surface normal
                hit.mtl = sphere.mtl; // Update material
                foundHit = true; // Intersection found
            }
        }
    }
    return foundHit; // Return true if an intersection is found, false otherwise
}

// Function to calculate the shading of a point on a surface
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
    vec3 ambientComponent = mtl.k_d * 0.05; // Ambient component of the shading
    vec3 color = ambientComponent; // Initialize color with ambient component
    normal = normalize(normal); // Normalize the surface normal

    for (int i = 0; i < NUM_LIGHTS; ++i) {
        vec3 lightDir = normalize(lights[i].position - position); // Direction from the point to the light source
        Ray shadowRay;
        shadowRay.pos = position + lightDir * 0.003; // Offset the shadow ray origin slightly to avoid self-intersection
        shadowRay.dir = lightDir; // Shadow ray direction

        if (!IntersectShadowRay(shadowRay)) {
            float cosTheta = max(dot(normal, lightDir), 0.0); // Cosine of the angle between the normal and light direction
            vec3 diffuseComponent = mtl.k_d * lights[i].intensity * cosTheta; // Diffuse component of the shading
            vec3 halfAngle = normalize(view + lightDir); // Half-angle vector for specular reflection
            vec3 specularComponent = mtl.k_s * lights[i].intensity * pow(max(dot(normal, halfAngle), 0.0), mtl.n); // Specular component of the shading

            color += diffuseComponent + specularComponent; // Accumulate the shading components
        }
    }
    return color; // Return the final shading color
}

// Function to perform ray tracing
vec4 RayTracer(Ray ray) {
    HitInfo hit;
    if (IntersectRay(hit, ray)) {
        vec3 view = normalize(-ray.dir); // View direction
        vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view); // Shading color at the intersection point
        vec3 k_s = hit.mtl.k_s; // Specular coefficient

        for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
            if (bounce >= bounceLimit) break; // Break if maximum number of bounces is reached
            if (dot(k_s, vec3(1.0)) <= 0.0) break; // Break if the specular coefficient is zero or negative

            Ray reflectRay;
            reflectRay.dir = normalize(reflect(ray.dir, hit.normal)); // Reflected ray direction
            reflectRay.pos = hit.position + reflectRay.dir * 0.0001; // Offset the reflected ray origin slightly to avoid self-intersection
            HitInfo reflectHit;

            if (IntersectRay(reflectHit, reflectRay)) {
                clr += Shade(reflectHit.mtl, reflectHit.position, reflectHit.normal, view); // Accumulate shading from the reflected ray
                hit = reflectHit; // Update hit information with the reflected intersection
                ray = reflectRay; // Update the ray with the reflected ray
            } else {
                clr += k_s * textureCube(envMap, reflectRay.dir.xzy).rgb; // Accumulate the environment map contribution
                break; // Break if no intersection is found for the reflected ray
            }
        }
        return vec4(clr, 1.0); // Return the final color
    } else {
        return vec4(textureCube(envMap, ray.dir.xzy).rgb, 1.0); // Return the color from the environment map
    }
}
`;
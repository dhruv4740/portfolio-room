export default function AmbientLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      {/* Pendant lamp above room center */}
      <pointLight
        position={[0, 1.6, 0]}
        color="#fff5e0"
        intensity={40}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />
    </>
  )
}

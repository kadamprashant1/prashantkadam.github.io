import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Space Shuttle Orbiter — stylized, proportion-aware model.
 *
 * World axes:
 *   X = left(-) / right(+)   (span)
 *   Y = nose(-) / tail(+)    (fuselage long axis)
 *   Z = belly(-) / back(+)   (vertical)
 */
const Shuttle = ({ thrusting = false, boosting = false }) => {
  const shuttleRef = useRef();
  const flameRefs = useRef([]);
  const innerFlameRefs = useRef([]);
  const coreFlameRef = useRef();
  const glowRingsRef = useRef([]);
  const antennaLightRef = useRef();
  const runwayLightsRef = useRef([]);

  const accentColor = '#00f0ff';
  const hullWhite = '#e9edf3';
  const tileBlack = '#14141a';
  const leadingEdgeGray = '#3a3a42';
  const S = 1.3;

  // --- Body reference values, taken directly from the fuselage geometry below ---
  // (fuselage mesh: position.y = -0.38, height 1.55, scale.x = 1.25, radius ~0.24-0.26)
  // Wings and fin are positioned relative to these so they stay flush with the body
  // instead of drifting off on their own offsets.
  const bodyCenterY = -0.38;           // fuselage mesh center (Y)
  const bodyHalfWidth = 0.30;          // fuselage outer radius after the 1.25x oval scale
  const bodyFrontY = bodyCenterY - 1.55 / 2; // -1.155, nose-side end of the fuselage
  const bodyAftY = bodyCenterY + 1.55 / 2;   //  0.395, tail-side end of the fuselage

  // --- True double-delta wing planform: steep inboard "glove" (~81°) sweep, ---
  // --- shallower outboard (~45°) sweep, matching the real Orbiter blueprint. ---
  const rightWingShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.02, 0.62);    // root leading edge, forward, tucked against fuselage
    s.lineTo(0.22, 0.58);    // steep inboard glove sweep (~81°)
    s.lineTo(0.50, 0.40);
    s.lineTo(1.02, -0.10);   // shallower outboard sweep (~45°) out to the tip area
    s.lineTo(0.92, -0.30);   // wingtip
    s.lineTo(0.62, -0.42);   // outer trailing edge (elevon line)
    s.lineTo(0.20, -0.46);
    s.lineTo(0.02, -0.50);   // root trailing edge
    s.lineTo(0.02, 0.62);
    return s;
  }, []);

  const leftWingShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.02, 0.62);
    s.lineTo(-0.22, 0.58);
    s.lineTo(-0.50, 0.40);
    s.lineTo(-1.02, -0.10);
    s.lineTo(-0.92, -0.30);
    s.lineTo(-0.62, -0.42);
    s.lineTo(-0.20, -0.46);
    s.lineTo(-0.02, -0.50);
    s.lineTo(-0.02, 0.62);
    return s;
  }, []);

  // --- Vertical stabilizer: tall, steeply-swept trapezoid ---
  const finShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.30, 0.0);     // root leading (forward-low)
    s.lineTo(-0.02, 0.66);   // tip leading (sharp sweep)
    s.lineTo(-0.14, 0.68);   // tip trailing
    s.lineTo(-0.34, 0.0);    // root trailing
    s.lineTo(0.30, 0.0);
    return s;
  }, []);

  const wingExtrude = { depth: 0.035, bevelEnabled: false };
  const edgeExtrude = { depth: 0.016, bevelEnabled: false };
  const finExtrude = { depth: 0.022, bevelEnabled: false };

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    flameRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const flicker = 0.75 + Math.sin(t * 35 + i * 2) * 0.15 + Math.sin(t * 53 + i) * 0.1;
      const base = thrusting ? (boosting ? 3.2 : 1.5) : 0.05;
      ref.scale.set(0.85 + Math.sin(t * 20 + i) * 0.15, base * flicker, 0.85 + Math.sin(t * 20 + i) * 0.15);
      ref.material.opacity = thrusting ? 0.6 * flicker : 0;
    });
    innerFlameRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const flicker2 = 0.7 + Math.sin(t * 48 + i * 1.5) * 0.2;
      const base2 = thrusting ? (boosting ? 2.2 : 0.9) : 0.03;
      ref.scale.y = base2 * flicker2;
      ref.material.opacity = thrusting ? 0.85 * flicker2 : 0;
    });
    if (coreFlameRef.current) {
      const f3 = 0.8 + Math.sin(t * 60) * 0.2;
      coreFlameRef.current.scale.y = (thrusting ? (boosting ? 1.8 : 0.6) : 0.01) * f3;
      coreFlameRef.current.material.opacity = thrusting ? 0.95 * f3 : 0;
    }

    glowRingsRef.current.forEach((ref) => {
      if (!ref) return;
      ref.material.emissiveIntensity = thrusting ? 1.5 + Math.sin(t * 10) * 0.5 : 0.2;
    });

    if (antennaLightRef.current) {
      antennaLightRef.current.material.emissiveIntensity = Math.sin(t * 3) > 0.4 ? 2.5 : 0.1;
    }

    runwayLightsRef.current.forEach((ref, i) => {
      if (!ref) return;
      const phase = (t * 3 + i * 0.6) % 3.0;
      ref.material.emissiveIntensity = phase < 1.0 ? phase * 1.5 : Math.max(0, 1.5 - (phase - 1.0));
    });

    if (shuttleRef.current) {
      shuttleRef.current.position.y = Math.sin(t * 1.8) * 0.012 * S;
      shuttleRef.current.rotation.z = Math.sin(t * 1.2) * 0.005;
    }
  });

  return (
    <group ref={shuttleRef} scale={[-S, S, S]} rotation={[0, Math.PI, 0]}>

      {/* ============================================================ */}
      {/*                     NOSE SECTION (ogive)                     */}
      {/* ============================================================ */}

      <mesh position={[0, -1.72, 0]} scale={[1.15, 1, 0.85]}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color="#0c0c0e" metalness={0.25} roughness={0.75} />
      </mesh>
      <mesh position={[0, -1.52, 0]} scale={[1.15, 1, 0.85]}>
        <cylinderGeometry args={[0.085, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.24, 0]} scale={[1.2, 1, 0.85]}>
        <cylinderGeometry args={[0.18, 0.24, 0.2, 16]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* ============================================================ */}
      {/*         CREW CABIN "GREENHOUSE" — raised flight-deck bump    */}
      {/* ============================================================ */}

      <mesh position={[0, -1.14, 0.09]} scale={[1, 1, 0.6]}>
        <boxGeometry args={[0.34, 0.34, 0.22]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Forward flight-deck windows — angled, 6-pane strip */}
      {[-0.075, -0.045, -0.015, 0.015, 0.045, 0.075].map((xOff, i) => (
        <mesh key={`wind-${i}`} position={[xOff, -1.02, 0.155]} rotation={[-0.55, 0, 0]}>
          <planeGeometry args={[0.024, 0.05]} />
          <meshStandardMaterial
            color="#0a1a22"
            emissive="#00ccff"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, -1.02, 0.16]} rotation={[-0.55, 0, 0]}>
        <boxGeometry args={[0.23, 0.06, 0.005]} />
        <meshStandardMaterial color="#2a2a34" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Overhead windows */}
      {[-0.05, 0.05].map((xOff, i) => (
        <mesh key={`topwind-${i}`} position={[xOff, -0.98, 0.20]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
          <planeGeometry args={[0.03, 0.03]} />
          <meshStandardMaterial color="#0a1a22" emissive="#00ccff" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Side windows */}
      {[-1, 1].map((side, i) => (
        <mesh key={`sidewind-${i}`} position={[0.145 * side, -1.05, 0.10]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.035, 0.03]} />
          <meshStandardMaterial color="#0a1a22" emissive="#00ccff" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ============================================================ */}
      {/*             MAIN FUSELAGE — flattened oval cross-section     */}
      {/* ============================================================ */}

      <mesh position={[0, -0.38, 0]} scale={[1.25, 1, 0.8]}>
        <cylinderGeometry args={[0.24, 0.26, 1.55, 20]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Payload bay doors */}
      <mesh position={[0, -0.38, 0.135]}>
        <boxGeometry args={[0.44, 1.45, 0.03]} />
        <meshStandardMaterial color="#d6dae2" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.38, 0.152]}>
        <boxGeometry args={[0.006, 1.43, 0.006]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Black thermal-tile belly */}
      <mesh position={[0, -0.45, -0.175]} scale={[1.25, 1, 1]}>
        <boxGeometry args={[0.42, 1.9, 0.09]} />
        <meshStandardMaterial color={tileBlack} metalness={0.15} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.08, -0.1]} rotation={[0.4, 0, 0]} scale={[1.15, 1, 1]}>
        <boxGeometry args={[0.3, 0.55, 0.05]} />
        <meshStandardMaterial color={tileBlack} metalness={0.15} roughness={0.95} />
      </mesh>

      {/* ============================================================ */}
      {/*                     ACCENT / ID STRIPES                      */}
      {/* ============================================================ */}

      <mesh position={[0.30, -0.38, 0.02]}>
        <boxGeometry args={[0.004, 1.15, 0.06]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.30, -0.38, 0.02]}>
        <boxGeometry args={[0.004, 1.15, 0.06]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>

      {/* ============================================================ */}
      {/*         DOUBLE-DELTA WINGS (extruded true planform)          */}
      {/* ============================================================ */}

      <mesh position={[bodyHalfWidth, bodyCenterY, -0.02]}>
        <extrudeGeometry args={[rightWingShape, wingExtrude]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[bodyHalfWidth, bodyCenterY, -0.055]}>
        <extrudeGeometry args={[rightWingShape, edgeExtrude]} />
        <meshStandardMaterial color={leadingEdgeGray} metalness={0.2} roughness={0.85} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[bodyHalfWidth + 0.97, bodyCenterY - 0.20, -0.01]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1.5} />
      </mesh>

      <mesh position={[-bodyHalfWidth, bodyCenterY, -0.02]}>
        <extrudeGeometry args={[leftWingShape, wingExtrude]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[-bodyHalfWidth, bodyCenterY, -0.055]}>
        <extrudeGeometry args={[leftWingShape, edgeExtrude]} />
        <meshStandardMaterial color={leadingEdgeGray} metalness={0.2} roughness={0.85} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[-(bodyHalfWidth + 0.97), bodyCenterY - 0.20, -0.01]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>

      {/* Elevon (trailing-edge control surface) accent lines */}
      <mesh position={[bodyHalfWidth + 0.65, bodyCenterY - 0.46, 0.0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.55, 0.012, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-(bodyHalfWidth + 0.65), bodyCenterY - 0.46, 0.0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.55, 0.012, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
      </mesh>

      {/* ============================================================ */}
      {/*                     VERTICAL TAIL FIN                        */}
      {/* ============================================================ */}

      <mesh position={[0, 0.05, 0.26]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
        <extrudeGeometry args={[finShape, finExtrude]} />
        <meshStandardMaterial color={hullWhite} metalness={0.4} roughness={0.4} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, -0.19, 0.60]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.018, 0.15, 0.14]} />
        <meshStandardMaterial color="#c8ccd6" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.10, 0.55]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.022, 0.22, 0.05]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, -0.03, 0.96]}>
        <cylinderGeometry args={[0.004, 0.003, 0.08, 4]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={antennaLightRef} position={[0, -0.03, 1.00]}>
        <sphereGeometry args={[0.011, 6, 6]} />
        <meshStandardMaterial color="#ff0033" emissive="#ff0033" emissiveIntensity={2} />
      </mesh>

      {/* ============================================================ */}
      {/*     OMS PODS — bulbous, merged into the tail-fin base        */}
      {/* ============================================================ */}

      {[-1, 1].map((side) => (
        <group key={`oms-${side}`} position={[0.17 * side, 0.06, 0.06]} rotation={[0, 0, 0.16 * side]}>
          {/* main pod body — tapered, teardrop-like */}
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.1]}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial color={hullWhite} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.075, 0.34, 12]} />
            <meshStandardMaterial color={hullWhite} metalness={0.45} roughness={0.35} />
          </mesh>
          {/* aft-facing OMS engine nozzle */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 10]} />
            <meshStandardMaterial color={tileBlack} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ============================================================ */}
      {/*                     BODY FLAP (aft, under engines)           */}
      {/* ============================================================ */}

      <mesh position={[0, 0.56, -0.15]} rotation={[0.08, 0, 0]} scale={[1.25, 1, 1]}>
        <boxGeometry args={[0.34, 0.16, 0.03]} />
        <meshStandardMaterial color={tileBlack} metalness={0.2} roughness={0.9} />
      </mesh>

      {/* ============================================================ */}
      {/*                  RUNWAY / CHASE LIGHTS                       */}
      {/* ============================================================ */}

      {[-0.85, -0.55, -0.25, 0.05].map((yOff, i) => (
        <mesh
          key={`rl-${i}`}
          ref={(el) => { runwayLightsRef.current[i] = el; }}
          position={[0, yOff, -0.22]}
        >
          <sphereGeometry args={[0.01, 6, 6]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* ============================================================ */}
      {/*                 ENGINE NOZZLES (3 SSMEs)                      */}
      {/* ============================================================ */}

      <mesh position={[0, 0.42, 0.02]} scale={[1.25, 1, 1]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 20]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.85} roughness={0.15} />
      </mesh>

      {[[-0.10, 0.48, -0.02], [0.10, 0.48, -0.02], [0, 0.48, 0.10]].map((pos, i) => (
        <group key={`eng-${i}`}>
          <mesh position={pos}>
            <cylinderGeometry args={[0.045, 0.028, 0.14, 12]} />
            <meshStandardMaterial color="#1e1e24" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh
            ref={(el) => { glowRingsRef.current[i] = el; }}
            position={[pos[0], pos[1] - 0.02, pos[2]]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.045, 0.005, 6, 16]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
          </mesh>
          <mesh ref={(el) => { flameRefs.current[i] = el; }} position={[pos[0], pos[1] + 0.16, pos[2]]}>
            <coneGeometry args={[0.045, 0.6, 10]} />
            <meshBasicMaterial color="#ff4400" transparent opacity={0} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={(el) => { innerFlameRefs.current[i] = el; }} position={[pos[0], pos[1] + 0.13, pos[2]]}>
            <coneGeometry args={[0.028, 0.45, 8]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}

      <mesh ref={coreFlameRef} position={[0, 0.60, 0.02]}>
        <coneGeometry args={[0.065, 0.8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ============================================================ */}
      {/*                     ENGINE GLOW LIGHTS                       */}
      {/* ============================================================ */}
      <pointLight position={[0, 0.70, 0.02]} color="#ff5500" intensity={thrusting ? (boosting ? 12 : 5) : 0} distance={8} />
      <pointLight position={[0, -1.55, 0.1]} color={accentColor} intensity={0.4} distance={3} />

    </group>
  );
};

export default Shuttle;
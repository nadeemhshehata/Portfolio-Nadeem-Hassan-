import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

interface RaceAnimationProps {
    vehicleATime: number;
    vehicleBTime: number;
    winner: "A" | "B" | "Tie";
    vehicleALabel: string;
    vehicleBLabel: string;
    vehicleAType: string;
    vehicleBType: string;
    onComplete: () => void;
}

const ANIMATION_DURATION = 8; // seconds (6–10s range)
const TRACK_LENGTH = 14;
const LANE_WIDTH = 1.2;

export default function RaceAnimation({
    vehicleATime,
    vehicleBTime,
    winner,
    vehicleALabel,
    vehicleBLabel,
    vehicleAType,
    vehicleBType,
    onComplete,
}: RaceAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animFrameRef = useRef<number>(0);
    const [skipped, setSkipped] = useState(false);
    const [loadingModels, setLoadingModels] = useState(true);

    useEffect(() => {
        // ACC-01: respect prefers-reduced-motion
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (motionQuery.matches) {
            onComplete();
            return;
        }

        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = Math.min(400, width * 0.55);

        // ── Scene ──
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c0c14);

        // ── Camera (bird's-eye / top-down) ──
        const aspect = width / height;
        const viewSize = 10;
        const camera = new THREE.OrthographicCamera(
            -viewSize * aspect,
            viewSize * aspect,
            viewSize,
            -viewSize,
            0.1,
            100
        );
        camera.position.set(0, 20, 0);
        camera.lookAt(0, 0, 0);

        // ── Renderer ──
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // ── Track ──
        const trackGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 4, LANE_WIDTH * 2 + 2);
        const trackMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        scene.add(track);

        // Lane divider (dashed center line)
        const dividerGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 2, 0.04);
        const dividerMat = new THREE.MeshBasicMaterial({ color: 0x444466 });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.rotation.x = -Math.PI / 2;
        divider.position.y = 0.01;
        scene.add(divider);

        // Lane edge lines
        for (const zOff of [-LANE_WIDTH - 0.5, LANE_WIDTH + 0.5]) {
            const edgeGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 2, 0.06);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0x333355 });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.rotation.x = -Math.PI / 2;
            edge.position.set(0, 0.01, zOff);
            scene.add(edge);
        }

        // Start line
        const startGeo = new THREE.PlaneGeometry(0.12, LANE_WIDTH * 2 + 1.6);
        const startMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const startLine = new THREE.Mesh(startGeo, startMat);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(-TRACK_LENGTH / 2, 0.01, 0);
        scene.add(startLine);

        // Finish line (checkered pattern approximation)
        const finishGeo = new THREE.PlaneGeometry(0.3, LANE_WIDTH * 2 + 1.6);
        const finishMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const finishLine = new THREE.Mesh(finishGeo, finishMat);
        finishLine.rotation.x = -Math.PI / 2;
        finishLine.position.set(TRACK_LENGTH / 2, 0.01, 0);
        scene.add(finishLine);

        // ── Vehicles ──
        let vehicleA: THREE.Object3D | null = null;
        let vehicleB: THREE.Object3D | null = null;

        const loader = new GLTFLoader();
        const modelAUrl = vehicleAType === "motorcycle" ? "/models/motorcycle.glb" : "/models/car.glb";
        const modelBUrl = vehicleBType === "motorcycle" ? "/models/motorcycle.glb" : "/models/car.glb";

        let finished = false;
        let startTime: number | null = null;

        Promise.all([
            loader.loadAsync(modelAUrl),
            loader.loadAsync(modelBUrl)
        ]).then(([gltfA, gltfB]) => {
            if (finished) return;

            vehicleA = gltfA.scene;
            vehicleB = gltfB.scene;

            vehicleA.scale.set(0.3, 0.3, 0.3);
            vehicleB.scale.set(0.3, 0.3, 0.3);

            vehicleA.position.set(-TRACK_LENGTH / 2 + 0.6, 0.2, -LANE_WIDTH / 2 - 0.15);
            vehicleB.position.set(-TRACK_LENGTH / 2 + 0.6, 0.2, LANE_WIDTH / 2 + 0.15);

            scene.add(vehicleA);
            scene.add(vehicleB);
            
            setLoadingModels(false);
            animFrameRef.current = requestAnimationFrame(animate);
        }).catch(err => {
            console.error("Missing GLB models", err);
            // Fallback to Box primitives instantly if missing
            const boxA = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.5), new THREE.MeshBasicMaterial({ color: 0x6c5ce7 }));
            const boxB = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.5), new THREE.MeshBasicMaterial({ color: 0x00d2a0 }));
            boxA.position.set(-TRACK_LENGTH / 2 + 0.6, 0.2, -LANE_WIDTH / 2 - 0.15);
            boxB.position.set(-TRACK_LENGTH / 2 + 0.6, 0.2, LANE_WIDTH / 2 + 0.15);
            scene.add(boxA);
            scene.add(boxB);
            vehicleA = boxA;
            vehicleB = boxB;

            setLoadingModels(false);
            animFrameRef.current = requestAnimationFrame(animate);
        });

        // Vehicle labels (A / B text sprites)
        function createLabel(text: string, color: number): THREE.Sprite {
            const canvas = document.createElement("canvas");
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
            ctx.font = "bold 40px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, 32, 32);
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.SpriteMaterial({ map: tex });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(0.8, 0.8, 1);
            return sprite;
        }
        const labelA = createLabel("A", 0xc4b5fd);
        labelA.position.set(-TRACK_LENGTH / 2 + 0.6, 0.8, -LANE_WIDTH / 2 - 0.15);
        scene.add(labelA);

        const labelB = createLabel("B", 0x6ee7b7);
        labelB.position.set(-TRACK_LENGTH / 2 + 0.6, 0.8, LANE_WIDTH / 2 + 0.15);
        scene.add(labelB);

        // ── Ambient lighting ──
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambient);

        // ── Animation ──
        // Normalize: both vehicles travel TRACK_LENGTH, the faster one finishes
        // at t = ANIMATION_DURATION, the slower one proportionally later
        // but we clamp the animation to ANIMATION_DURATION total
        const maxTime = Math.max(vehicleATime, vehicleBTime);
        const startX = -TRACK_LENGTH / 2 + 0.6;
        const endX = TRACK_LENGTH / 2 - 0.6;
        const totalDistance = endX - startX;

        // Speed: the faster vehicle covers the track in ANIMATION_DURATION
        // Slower vehicle covers proportionally less distance in the same time
        const speedA = (totalDistance / vehicleATime) * (maxTime / ANIMATION_DURATION) * vehicleATime / maxTime;
        const speedB = (totalDistance / vehicleBTime) * (maxTime / ANIMATION_DURATION) * vehicleBTime / maxTime;

        // Simpler approach: both reach the finish line, but at different times
        // The faster vehicle reaches endX at time t_fast = ANIMATION_DURATION * (fastTime / maxTime)
        // The slower vehicle reaches at t = ANIMATION_DURATION
        const tFinishA = ANIMATION_DURATION * (vehicleATime / maxTime);
        const tFinishB = ANIMATION_DURATION * (vehicleBTime / maxTime);

        function animate(timestamp: number) {
            if (finished) return;
            if (startTime === null) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000; // seconds

            // Position = lerp from startX to endX based on elapsed / tFinish
            const progressA = Math.min(elapsed / tFinishA, 1);
            const progressB = Math.min(elapsed / tFinishB, 1);

            // Ease-in-out for more dynamic feel
            const easeA = progressA < 0.5
                ? 2 * progressA * progressA
                : 1 - Math.pow(-2 * progressA + 2, 2) / 2;
            const easeB = progressB < 0.5
                ? 2 * progressB * progressB
                : 1 - Math.pow(-2 * progressB + 2, 2) / 2;

            if (vehicleA) vehicleA.position.x = startX + easeA * totalDistance;
            if (vehicleB) vehicleB.position.x = startX + easeB * totalDistance;

            // Keep labels above vehicles
            if (vehicleA) labelA.position.x = vehicleA.position.x;
            if (vehicleB) labelB.position.x = vehicleB.position.x;

            renderer.render(scene, camera);

            if (elapsed >= ANIMATION_DURATION + 0.5) {
                finished = true;
                onComplete();
                return;
            }

            animFrameRef.current = requestAnimationFrame(animate);
        }

        // ── Resize handler ──
        function handleResize() {
            if (!container) return;
            const w = container.clientWidth;
            const h = Math.min(400, w * 0.55);
            const asp = w / h;
            camera.left = -viewSize * asp;
            camera.right = viewSize * asp;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener("resize", handleResize);

        // ── Cleanup ──
        return () => {
            finished = true;
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            if (container && renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [vehicleATime, vehicleBTime, onComplete]);

    const handleSkip = () => {
        setSkipped(true);
        cancelAnimationFrame(animFrameRef.current);
        if (rendererRef.current) {
            rendererRef.current.dispose();
        }
        onComplete();
    };

    if (skipped) return null;

    return (
        <div className="race-animation" role="region" aria-label="Race animation">
            <div className="race-animation__header">
                <div className="race-animation__labels">
                    <span className="race-label race-label--a">
                        <span className="race-label__dot race-label__dot--a" />
                        A: {vehicleALabel}
                    </span>
                    <span className="race-label race-label--b">
                        <span className="race-label__dot race-label__dot--b" />
                        B: {vehicleBLabel}
                    </span>
                </div>
            </div>
            <div style={{ position: "relative" }}>
                {loadingModels && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.5)", zIndex: 10 }}>
                        <div className="status race-loading-spinner" aria-live="polite">Loading 3D Models...</div>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="race-animation__canvas"
                />
            </div>
            <button
                className="btn btn--skip"
                onClick={handleSkip}
                aria-label="Skip race animation and go to results"
            >
                ⏩ Skip Animation
            </button>
        </div>
    );
}
